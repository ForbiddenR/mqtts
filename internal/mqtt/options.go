package mqtt

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/eclipse/paho.golang/paho"
	"github.com/nictoarch/mqtts/internal/models"
)

// BuildConnectPacket creates a Paho Connect packet from a connection model.
func BuildConnectPacket(conn *models.Connection, will *models.Will) (*paho.Connect, error) {
	clientID := conn.ClientID
	if conn.ClientIDWithTime {
		clientID = fmt.Sprintf("%s_%d", clientID, time.Now().UnixMilli())
	}

	cp := &paho.Connect{
		ClientID:   clientID,
		KeepAlive:  uint16(conn.KeepAlive),
		CleanStart: conn.Clean,
		Username:   conn.Username,
		Password:   []byte(conn.Password),
	}

	if conn.Username != "" {
		cp.UsernameFlag = true
	}
	if conn.Password != "" {
		cp.PasswordFlag = true
	}

	// Set MQTT 5 properties
	if conn.MQTTVersion == "5.0" && conn.MQTT5Properties != nil {
		props := &paho.ConnectProperties{
			AuthMethod: conn.MQTT5Properties.AuthenticationMethod,
			AuthData:   []byte(conn.MQTT5Properties.AuthenticationData),
		}

		if conn.MQTT5Properties.ReceiveMaximum != nil {
			v := uint16(*conn.MQTT5Properties.ReceiveMaximum)
			props.ReceiveMaximum = &v
		}
		if conn.MQTT5Properties.MaximumPacketSize != nil {
			v := uint32(*conn.MQTT5Properties.MaximumPacketSize)
			props.MaximumPacketSize = &v
		}
		if conn.MQTT5Properties.TopicAliasMaximum != nil {
			v := uint16(*conn.MQTT5Properties.TopicAliasMaximum)
			props.TopicAliasMaximum = &v
		}
		if conn.MQTT5Properties.SessionExpiryInterval != nil {
			v := uint32(*conn.MQTT5Properties.SessionExpiryInterval)
			props.SessionExpiryInterval = &v
		}
		if conn.MQTT5Properties.RequestResponseInformation != nil {
			props.RequestResponseInfo = *conn.MQTT5Properties.RequestResponseInformation
		}
		if conn.MQTT5Properties.RequestProblemInformation != nil {
			props.RequestProblemInfo = *conn.MQTT5Properties.RequestProblemInformation
		}

		if conn.MQTT5Properties.UserProperties != nil {
			for k, v := range conn.MQTT5Properties.UserProperties {
				props.User = append(props.User, paho.UserProperty{Key: k, Value: v})
			}
		}

		cp.Properties = props
	}

	// Set will message
	if will != nil && will.LastWillTopic != "" {
		cp.WillMessage = &paho.WillMessage{
			Topic:   will.LastWillTopic,
			Payload: []byte(will.LastWillPayload),
			QoS:     byte(will.LastWillQoS),
			Retain:  will.LastWillRetain,
		}

		if conn.MQTTVersion == "5.0" {
			willProps := &paho.WillProperties{}

			if will.WillDelayInterval != nil {
				v := uint32(*will.WillDelayInterval)
				willProps.WillDelayInterval = &v
			}
			if will.PayloadFormatIndicator != nil {
				v := byte(0)
				if *will.PayloadFormatIndicator {
					v = 1
				}
				willProps.PayloadFormat = &v
			}
			if will.MessageExpiryInterval != nil {
				v := uint32(*will.MessageExpiryInterval)
				willProps.MessageExpiry = &v
			}
			if will.ContentType != "" {
				willProps.ContentType = will.ContentType
			}
			if will.ResponseTopic != "" {
				willProps.ResponseTopic = will.ResponseTopic
			}
			if will.CorrelationData != "" {
				willProps.CorrelationData = []byte(will.CorrelationData)
			}
			if will.UserProperties != nil {
				for k, v := range will.UserProperties {
					willProps.User = append(willProps.User, paho.UserProperty{Key: k, Value: v})
				}
			}
			cp.WillProperties = willProps
		}
	}

	return cp, nil
}

// BuildPublishPacket creates a Paho publish packet.
func BuildPublishPacket(topic, payload string, qos byte, retain bool, conn *models.Connection) *paho.Publish {
	pub := &paho.Publish{
		Topic:   topic,
		Payload: []byte(payload),
		QoS:     qos,
		Retain:  retain,
	}

	// Apply default publish properties from connection
	if conn.MQTTVersion == "5.0" && conn.PushProps != nil {
		props := &paho.PublishProperties{}

		if conn.PushProps.PayloadFormatIndicator != nil {
			v := byte(0)
			if *conn.PushProps.PayloadFormatIndicator {
				v = 1
			}
			props.PayloadFormat = &v
		}
		if conn.PushProps.MessageExpiryInterval != nil {
			v := uint32(*conn.PushProps.MessageExpiryInterval)
			props.MessageExpiry = &v
		}
		if conn.PushProps.TopicAlias != nil {
			v := uint16(*conn.PushProps.TopicAlias)
			props.TopicAlias = &v
		}
		if conn.PushProps.ResponseTopic != "" {
			props.ResponseTopic = conn.PushProps.ResponseTopic
		}
		if conn.PushProps.CorrelationData != "" {
			props.CorrelationData = []byte(conn.PushProps.CorrelationData)
		}
		if conn.PushProps.ContentType != "" {
			props.ContentType = conn.PushProps.ContentType
		}
		if conn.PushProps.UserProperties != nil {
			for k, v := range conn.PushProps.UserProperties {
				props.User = append(props.User, paho.UserProperty{Key: k, Value: v})
			}
		}

		pub.Properties = props
	}

	return pub
}

// BuildSubscribePacket creates a Paho subscribe packet.
func BuildSubscribePacket(topic string, qos byte, sub *models.Subscription) *paho.Subscribe {
	subs := []paho.SubscribeOptions{
		{
			Topic: topic,
			QoS:   qos,
		},
	}

	// Apply MQTT 5 subscription options if available
	if sub != nil {
		subs[0].NoLocal = sub.NL
		subs[0].RetainAsPublished = sub.RAP
		subs[0].RetainHandling = byte(sub.RH)
	}

	return &paho.Subscribe{
		Subscriptions: subs,
	}
}

// BuildTLSConfig creates a TLS configuration from connection certificate settings.
func BuildTLSConfig(conn *models.Connection) (*tls.Config, error) {
	if !conn.SSL {
		return nil, nil
	}

	config := &tls.Config{
		InsecureSkipVerify: !conn.RejectUnauthorized,
	}

	// Load CA certificate if provided
	if conn.CA != "" {
		caCertPool := x509.NewCertPool()
		if !caCertPool.AppendCertsFromPEM([]byte(conn.CA)) {
			return nil, fmt.Errorf("failed to parse CA certificate")
		}
		config.RootCAs = caCertPool
	}

	// Load client certificate if provided (for mutual TLS)
	if conn.Cert != "" && conn.Key != "" {
		cert, err := tls.X509KeyPair([]byte(conn.Cert), []byte(conn.Key))
		if err != nil {
			return nil, fmt.Errorf("load client certificate: %w", err)
		}
		config.Certificates = []tls.Certificate{cert}
	}

	// Set ALPN protocols if provided
	if conn.ALPNProtocols != "" {
		protocols := strings.Split(conn.ALPNProtocols, ",")
		for i, p := range protocols {
			protocols[i] = strings.TrimSpace(p)
		}
		config.NextProtos = protocols
	}

	return config, nil
}

// BuildServerURL constructs the broker URL from connection fields.
func BuildServerURL(conn *models.Connection) (string, error) {
	host := conn.Host
	if host == "" {
		return "", fmt.Errorf("host is required")
	}
	port := conn.Port
	if port == 0 {
		switch conn.Protocol {
		case models.ProtocolMQTT:
			port = 1883
		case models.ProtocolMQTTS:
			port = 8883
		case models.ProtocolWS:
			port = 80
		case models.ProtocolWSS:
			port = 443
		default:
			port = 1883
		}
	}

	path := conn.Path
	if path == "" {
		path = "/mqtt"
	}
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}

	switch conn.Protocol {
	case models.ProtocolMQTT:
		return fmt.Sprintf("tcp://%s:%d", host, port), nil
	case models.ProtocolMQTTS:
		return fmt.Sprintf("ssl://%s:%d", host, port), nil
	case models.ProtocolWS:
		wsURL := url.URL{
			Scheme: "ws",
			Host:   fmt.Sprintf("%s:%d", host, port),
			Path:   path,
		}
		return wsURL.String(), nil
	case models.ProtocolWSS:
		wsURL := url.URL{
			Scheme: "wss",
			Host:   fmt.Sprintf("%s:%d", host, port),
			Path:   path,
		}
		return wsURL.String(), nil
	default:
		return fmt.Sprintf("tcp://%s:%d", host, port), nil
	}
}

// ProtocolVersion returns the Paho protocol version number for an MQTT version string.
func ProtocolVersion(mqttVersion string) byte {
	switch mqttVersion {
	case "3.1":
		return 3
	case "3.1.1":
		return 4
	case "5.0":
		return 5
	default:
		return 4
	}
}
