use anyhow::{Context, Result};
use base64::{Engine, engine::general_purpose::STANDARD};
use crossbeam_channel::Receiver;
use serde::{Deserialize, Serialize};
use smtc_suite::{
    MediaCommand as SmtcControlCommandInternal, MediaUpdate, NowPlayingInfo as SmtcNowPlayingInfo,
    SmtcSessionInfo as SuiteSmtcSessionInfo,
};
use std::thread;
use tauri::{AppHandle, Emitter, Runtime};
use tracing::{error, info, warn};

/// 文本转换模式。
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum TextConversionMode {
    Off,
    TraditionalToSimplified,
    SimplifiedToTraditional,
    SimplifiedToTaiwan,
    TaiwanToSimplified,
    SimplifiedToHongKong,
    HongKongToSimplified,
}

/// 发送到 Tauri 前端的事件的统一封装。
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", content = "data", rename_all = "camelCase")]
pub enum SmtcEvent {
    /// 曲目信息已更新。负载是完整的 NowPlayingInfo 对象。
    TrackChanged(FrontendNowPlayingInfo),
    SessionsChanged(Vec<SmtcSessionInfo>),
    /// 之前选择的媒体会话已消失。
    SelectedSessionVanished(String),
    /// 接收到一个音频数据包。
    AudioData(Vec<u8>),
    /// 报告一个错误。
    Error(String),
    /// 音量或静音状态已发生变化。
    VolumeChanged {
        volume: f32,
        is_muted: bool,
    },
}

/// SMTC 会话信息的封装，用于在前端显示。
#[derive(Debug, Clone, Serialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub struct SmtcSessionInfo {
    pub session_id: String,
    pub display_name: String,
}

impl From<SuiteSmtcSessionInfo> for SmtcSessionInfo {
    fn from(info: SuiteSmtcSessionInfo) -> Self {
        Self {
            session_id: info.session_id,
            display_name: info.display_name,
        }
    }
}

/// 从 Tauri 前端接收的媒体控制命令。
#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum MediaCommand {
    SelectSession { session_id: String },
    SetTextConversion { mode: TextConversionMode },
    SetShuffle { is_active: bool },
    SetRepeatMode { mode: RepeatMode },
    Play,
    Pause,
    SkipNext,
    SkipPrevious,
    SeekTo { time_ms: u64 },
    SetVolume { volume: f32 },
    StartAudioVisualization,
    StopAudioVisualization,
    SetHighFrequencyProgressUpdates { enabled: bool },
}

/// 重复播放模式。
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum RepeatMode {
    Off,
    One,
    All,
}

/// 专门用于发送给前端的 NowPlayingInfo DTO。
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FrontendNowPlayingInfo {
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album_title: Option<String>,
    pub duration_ms: Option<u64>,
    pub position_ms: Option<u64>,
    pub is_playing: Option<bool>,
    pub is_shuffle_active: Option<bool>,
    pub repeat_mode: Option<RepeatMode>,
    pub can_play: Option<bool>,
    pub can_pause: Option<bool>,
    pub can_skip_next: Option<bool>,
    pub can_skip_previous: Option<bool>,
    pub cover_data: Option<String>,
    pub cover_data_hash: Option<u64>,
}

/// 将后端库的结构转换为前端 DTO。
impl From<SmtcNowPlayingInfo> for FrontendNowPlayingInfo {
    fn from(info: SmtcNowPlayingInfo) -> Self {
        Self {
            title: info.title,
            artist: info.artist,
            album_title: info.album_title,
            duration_ms: info.duration_ms,
            position_ms: info.position_ms,
            is_playing: info.is_playing,
            is_shuffle_active: info.is_shuffle_active,
            repeat_mode: info.repeat_mode.map(|m| match m {
                smtc_suite::RepeatMode::Off => RepeatMode::Off,
                smtc_suite::RepeatMode::One => RepeatMode::One,
                smtc_suite::RepeatMode::All => RepeatMode::All,
            }),
            can_play: info.can_play,
            can_pause: info.can_pause,
            can_skip_next: info.can_skip_next,
            can_skip_previous: info.can_skip_previous,
            cover_data: info.cover_data.map(|bytes| STANDARD.encode(bytes)),
            cover_data_hash: info.cover_data_hash,
        }
    }
}

/// Tauri 的状态管理结构体。
pub struct ExternalMediaControllerState {
    /// 向 `smtc-suite` 发送命令的通道发送端。
    pub smtc_command_tx:
        std::sync::Arc<std::sync::Mutex<crossbeam_channel::Sender<SmtcControlCommandInternal>>>,
}

impl ExternalMediaControllerState {
    /// 辅助函数，用于安全地发送命令到 `smtc-suite`。
    pub fn send_smtc_command(&self, command: SmtcControlCommandInternal) -> anyhow::Result<()> {
        let guard = self
            .smtc_command_tx
            .lock()
            .map_err(|e| anyhow::anyhow!("SMTC 命令通道的 Mutex 锁已毒化：{}", e))?;
        guard.send(command).context("发送命令到 SMTC 监听线程失败")
    }
}

/// Tauri 命令：处理所有来自前端的媒体控制请求。
#[tauri::command]
pub async fn control_external_media(
    payload: MediaCommand,
    state: tauri::State<'_, ExternalMediaControllerState>,
) -> Result<(), String> {
    info!("接收到控制命令: {:?}", payload);

    let command = match payload {
        MediaCommand::SelectSession { session_id } => {
            // 前端可能会传来 "null" 字符串，需要特殊处理为空字符串，切换为自动选择模式。
            let target_id = if session_id == "null" {
                "".to_string()
            } else {
                session_id
            };
            SmtcControlCommandInternal::SelectSession(target_id)
        }
        MediaCommand::SetTextConversion { mode } => {
            let suite_mode = match mode {
                TextConversionMode::Off => smtc_suite::TextConversionMode::Off,
                TextConversionMode::TraditionalToSimplified => {
                    smtc_suite::TextConversionMode::TraditionalToSimplified
                }
                TextConversionMode::SimplifiedToTraditional => {
                    smtc_suite::TextConversionMode::SimplifiedToTraditional
                }
                TextConversionMode::SimplifiedToTaiwan => {
                    smtc_suite::TextConversionMode::SimplifiedToTaiwan
                }
                TextConversionMode::TaiwanToSimplified => {
                    smtc_suite::TextConversionMode::TaiwanToSimplified
                }
                TextConversionMode::SimplifiedToHongKong => {
                    smtc_suite::TextConversionMode::SimplifiedToHongKong
                }
                TextConversionMode::HongKongToSimplified => {
                    smtc_suite::TextConversionMode::HongKongToSimplified
                }
            };
            SmtcControlCommandInternal::SetTextConversion(suite_mode)
        }
        MediaCommand::SetShuffle { is_active } => SmtcControlCommandInternal::Control(
            smtc_suite::SmtcControlCommand::SetShuffle(is_active),
        ),
        MediaCommand::SetRepeatMode { mode } => {
            let suite_mode = match mode {
                RepeatMode::Off => smtc_suite::RepeatMode::Off,
                RepeatMode::One => smtc_suite::RepeatMode::One,
                RepeatMode::All => smtc_suite::RepeatMode::All,
            };
            SmtcControlCommandInternal::Control(smtc_suite::SmtcControlCommand::SetRepeatMode(
                suite_mode,
            ))
        }
        MediaCommand::Play => {
            SmtcControlCommandInternal::Control(smtc_suite::SmtcControlCommand::Play)
        }
        MediaCommand::Pause => {
            SmtcControlCommandInternal::Control(smtc_suite::SmtcControlCommand::Pause)
        }
        MediaCommand::SkipNext => {
            SmtcControlCommandInternal::Control(smtc_suite::SmtcControlCommand::SkipNext)
        }
        MediaCommand::SkipPrevious => {
            SmtcControlCommandInternal::Control(smtc_suite::SmtcControlCommand::SkipPrevious)
        }
        MediaCommand::SeekTo { time_ms } => {
            SmtcControlCommandInternal::Control(smtc_suite::SmtcControlCommand::SeekTo(time_ms))
        }
        MediaCommand::SetVolume { volume } => {
            let clamped_volume = volume.clamp(0.0, 1.0);
            SmtcControlCommandInternal::Control(smtc_suite::SmtcControlCommand::SetVolume(
                clamped_volume,
            ))
        }
        MediaCommand::StartAudioVisualization => SmtcControlCommandInternal::StartAudioCapture,
        MediaCommand::StopAudioVisualization => SmtcControlCommandInternal::StopAudioCapture,
        MediaCommand::SetHighFrequencyProgressUpdates { enabled } => {
            SmtcControlCommandInternal::SetHighFrequencyProgressUpdates(enabled)
        }
    };

    state.send_smtc_command(command).map_err(|e| e.to_string())
}

/// Tauri 命令：请求一次全量的状态更新。
#[tauri::command]
pub async fn request_smtc_update(
    state: tauri::State<'_, ExternalMediaControllerState>,
) -> Result<(), String> {
    info!("正在请求 SMTC 更新...");
    state
        .send_smtc_command(SmtcControlCommandInternal::RequestUpdate)
        .map_err(|e| e.to_string())
}

/// 启动所有后台监听服务。
pub fn start_listener<R: Runtime>(app_handle: AppHandle<R>) -> ExternalMediaControllerState {
    info!("正在启动 SMTC 监听器...");
    let controller = match smtc_suite::MediaManager::start() {
        Ok(c) => c,
        Err(e) => {
            error!("启动 smtc-suite MediaManager 失败: {}", e);
            // 如果启动失败，创建一个哑状态，防止应用崩溃，但功能将不可用。
            let (smtc_tx, _) = crossbeam_channel::unbounded();
            return ExternalMediaControllerState {
                smtc_command_tx: std::sync::Arc::new(std::sync::Mutex::new(smtc_tx)),
            };
        }
    };

    let update_rx_crossbeam = controller.update_rx;
    let smtc_command_tx_crossbeam = controller.command_tx;

    let app_handle_receiver = app_handle.clone();
    thread::Builder::new()
        .name("smtc-event-receiver".into())
        .spawn(move || {
            event_receiver_loop(app_handle_receiver, update_rx_crossbeam);
        })
        .expect("创建 smtc-event-receiver 线程失败");

    if smtc_command_tx_crossbeam
        .send(SmtcControlCommandInternal::SetHighFrequencyProgressUpdates(
            true,
        ))
        .is_err()
    {
        warn!("启用高频更新失败，通道可能已关闭。");
    }

    ExternalMediaControllerState {
        smtc_command_tx: std::sync::Arc::new(std::sync::Mutex::new(smtc_command_tx_crossbeam)),
    }
}

/// 核心事件循环，运行在专用的后台线程中。
fn event_receiver_loop<R: Runtime>(app_handle: AppHandle<R>, update_rx: Receiver<MediaUpdate>) {
    for update in update_rx {
        let event_to_emit = match update {
            MediaUpdate::TrackChanged(info) | MediaUpdate::TrackChangedForced(info) => {
                let dto = parse_apple_music_field(info.into());
                SmtcEvent::TrackChanged(dto)
            }
            MediaUpdate::SessionsChanged(sessions) => SmtcEvent::SessionsChanged(
                sessions.into_iter().map(SmtcSessionInfo::from).collect(),
            ),
            MediaUpdate::AudioData(bytes) => SmtcEvent::AudioData(bytes),
            MediaUpdate::Error(e) => SmtcEvent::Error(e),
            MediaUpdate::VolumeChanged {
                volume, is_muted, ..
            } => SmtcEvent::VolumeChanged { volume, is_muted },
            MediaUpdate::SelectedSessionVanished(id) => SmtcEvent::SelectedSessionVanished(id),
        };

        if let Err(e) = app_handle.emit("smtc_update", event_to_emit) {
            warn!("向前端发送 smtc_update 事件失败: {}", e);
        }
    }
    info!("媒体事件通道已关闭，接收线程退出。");
}

/// 特殊的解析逻辑，用于处理 Apple Music 的元数据。
fn parse_apple_music_field(mut info: FrontendNowPlayingInfo) -> FrontendNowPlayingInfo {
    if let Some(original_artist_field) = info.artist.take() {
        if let Some((artist, album)) = original_artist_field.split_once(" — ") {
            info.artist = Some(artist.trim().to_string());
            // 只有在专辑字段原本为空时才覆盖。
            if info.album_title.as_deref().unwrap_or("").is_empty() {
                info.album_title = Some(album.trim().to_string());
            }
        } else {
            // 如果不匹配 " — " 格式，则将原始字符串放回。
            info.artist = Some(original_artist_field);
        }
    }
    info
}
