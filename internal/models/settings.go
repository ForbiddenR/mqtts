package models

// Settings represents the application settings singleton.
type Settings struct {
	ID                 string `json:"id"`
	Width              int    `json:"width"`
	Height             int    `json:"height"`
	AutoCheck          bool   `json:"auto_check"`
	CurrentLang        string `json:"current_lang"`
	CurrentTheme       string `json:"current_theme"`
	MaxReconnectTimes  int    `json:"max_reconnect_times"`
	AutoResub          bool   `json:"auto_resub"`
	SyncOSTheme        bool   `json:"sync_os_theme"`
	MultiTopics        bool   `json:"multi_topics"`
	JSONHighlight      bool   `json:"json_highlight"`
	EnableCopilot      bool   `json:"enable_copilot"`
	OpenAIAPIHost      string `json:"open_ai_api_host"`
	OpenAIAPIKey       string `json:"open_ai_api_key"`
	Model              string `json:"model"`
	LogLevel           string `json:"log_level"`
	IgnoreQoS0Message  bool   `json:"ignore_qos0_message"`
}

// DefaultSettings returns settings with upstream MQTTX-compatible defaults.
func DefaultSettings() Settings {
	return Settings{
		Width:              1025,
		Height:             749,
		AutoCheck:          true,
		CurrentLang:        "en",
		CurrentTheme:       "light",
		MaxReconnectTimes:  10,
		AutoResub:          true,
		SyncOSTheme:        false,
		MultiTopics:        true,
		JSONHighlight:      true,
		EnableCopilot:      false,
		OpenAIAPIHost:      "https://api.openai.com/v1",
		OpenAIAPIKey:       "",
		Model:              "gpt-4o",
		LogLevel:           "info",
		IgnoreQoS0Message:  false,
	}
}
