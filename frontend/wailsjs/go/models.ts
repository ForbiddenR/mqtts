export namespace main {
	
	export class ImportResult {
	    connectionsImported: number;
	    subscriptionsImported: number;
	    errors?: string[];
	
	    static createFrom(source: any = {}) {
	        return new ImportResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.connectionsImported = source["connectionsImported"];
	        this.subscriptionsImported = source["subscriptionsImported"];
	        this.errors = source["errors"];
	    }
	}
	export class ListMessagesInput {
	    connectionId: string;
	    limit: number;
	    offset: number;
	
	    static createFrom(source: any = {}) {
	        return new ListMessagesInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.connectionId = source["connectionId"];
	        this.limit = source["limit"];
	        this.offset = source["offset"];
	    }
	}
	export class ListMessagesResult {
	    messages: models.Message[];
	    total: number;
	
	    static createFrom(source: any = {}) {
	        return new ListMessagesResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.messages = this.convertValues(source["messages"], models.Message);
	        this.total = source["total"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PublishInput {
	    connectionId: string;
	    topic: string;
	    payload: string;
	    qos: number;
	    retain: boolean;
	
	    static createFrom(source: any = {}) {
	        return new PublishInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.connectionId = source["connectionId"];
	        this.topic = source["topic"];
	        this.payload = source["payload"];
	        this.qos = source["qos"];
	        this.retain = source["retain"];
	    }
	}
	export class SubscribeInput {
	    connectionId: string;
	    topic: string;
	    qos: number;
	
	    static createFrom(source: any = {}) {
	        return new SubscribeInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.connectionId = source["connectionId"];
	        this.topic = source["topic"];
	        this.qos = source["qos"];
	    }
	}
	export class UnsubscribeInput {
	    connectionId: string;
	    topic: string;
	
	    static createFrom(source: any = {}) {
	        return new UnsubscribeInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.connectionId = source["connectionId"];
	        this.topic = source["topic"];
	    }
	}

}

export namespace models {
	
	export class PushProperties {
	    payload_format_indicator?: boolean;
	    message_expiry_interval?: number;
	    topic_alias?: number;
	    response_topic?: string;
	    correlation_data?: string;
	    user_properties?: Record<string, string>;
	    subscription_identifier?: number;
	    content_type?: string;
	
	    static createFrom(source: any = {}) {
	        return new PushProperties(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.payload_format_indicator = source["payload_format_indicator"];
	        this.message_expiry_interval = source["message_expiry_interval"];
	        this.topic_alias = source["topic_alias"];
	        this.response_topic = source["response_topic"];
	        this.correlation_data = source["correlation_data"];
	        this.user_properties = source["user_properties"];
	        this.subscription_identifier = source["subscription_identifier"];
	        this.content_type = source["content_type"];
	    }
	}
	export class MQTT5Properties {
	    session_expiry_interval?: number;
	    receive_maximum?: number;
	    maximum_packet_size?: number;
	    topic_alias_maximum?: number;
	    request_response_information?: boolean;
	    request_problem_information?: boolean;
	    user_properties?: Record<string, string>;
	    authentication_method?: string;
	    authentication_data?: string;
	
	    static createFrom(source: any = {}) {
	        return new MQTT5Properties(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.session_expiry_interval = source["session_expiry_interval"];
	        this.receive_maximum = source["receive_maximum"];
	        this.maximum_packet_size = source["maximum_packet_size"];
	        this.topic_alias_maximum = source["topic_alias_maximum"];
	        this.request_response_information = source["request_response_information"];
	        this.request_problem_information = source["request_problem_information"];
	        this.user_properties = source["user_properties"];
	        this.authentication_method = source["authentication_method"];
	        this.authentication_data = source["authentication_data"];
	    }
	}
	export class Connection {
	    id: string;
	    client_id: string;
	    name: string;
	    clean: boolean;
	    protocol: string;
	    host: string;
	    port: number;
	    keepalive: number;
	    connect_timeout: number;
	    reconnect: boolean;
	    reconnect_period: number;
	    username?: string;
	    password?: string;
	    path?: string;
	    ssl: boolean;
	    mqtt_version: string;
	    unread_message_count: number;
	    client_id_with_time: boolean;
	    order_id: number;
	    is_collection: boolean;
	    parent_id?: string;
	    // Go type: time
	    created_at: any;
	    // Go type: time
	    updated_at: any;
	    cert_type?: string;
	    reject_unauthorized: boolean;
	    alpn_protocols?: string;
	    ca?: string;
	    cert?: string;
	    key?: string;
	    mqtt5_properties?: MQTT5Properties;
	    push_props?: PushProperties;
	
	    static createFrom(source: any = {}) {
	        return new Connection(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.client_id = source["client_id"];
	        this.name = source["name"];
	        this.clean = source["clean"];
	        this.protocol = source["protocol"];
	        this.host = source["host"];
	        this.port = source["port"];
	        this.keepalive = source["keepalive"];
	        this.connect_timeout = source["connect_timeout"];
	        this.reconnect = source["reconnect"];
	        this.reconnect_period = source["reconnect_period"];
	        this.username = source["username"];
	        this.password = source["password"];
	        this.path = source["path"];
	        this.ssl = source["ssl"];
	        this.mqtt_version = source["mqtt_version"];
	        this.unread_message_count = source["unread_message_count"];
	        this.client_id_with_time = source["client_id_with_time"];
	        this.order_id = source["order_id"];
	        this.is_collection = source["is_collection"];
	        this.parent_id = source["parent_id"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.updated_at = this.convertValues(source["updated_at"], null);
	        this.cert_type = source["cert_type"];
	        this.reject_unauthorized = source["reject_unauthorized"];
	        this.alpn_protocols = source["alpn_protocols"];
	        this.ca = source["ca"];
	        this.cert = source["cert"];
	        this.key = source["key"];
	        this.mqtt5_properties = this.convertValues(source["mqtt5_properties"], MQTT5Properties);
	        this.push_props = this.convertValues(source["push_props"], PushProperties);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class Message {
	    id: string;
	    // Go type: time
	    created_at: any;
	    out: boolean;
	    payload: string;
	    qos: number;
	    retain: boolean;
	    topic: string;
	    meta?: string;
	    payload_format_indicator?: boolean;
	    message_expiry_interval?: number;
	    topic_alias?: number;
	    response_topic?: string;
	    correlation_data?: string;
	    user_properties?: Record<string, string>;
	    subscription_identifier?: number;
	    content_type?: string;
	    connection_id: string;
	
	    static createFrom(source: any = {}) {
	        return new Message(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.out = source["out"];
	        this.payload = source["payload"];
	        this.qos = source["qos"];
	        this.retain = source["retain"];
	        this.topic = source["topic"];
	        this.meta = source["meta"];
	        this.payload_format_indicator = source["payload_format_indicator"];
	        this.message_expiry_interval = source["message_expiry_interval"];
	        this.topic_alias = source["topic_alias"];
	        this.response_topic = source["response_topic"];
	        this.correlation_data = source["correlation_data"];
	        this.user_properties = source["user_properties"];
	        this.subscription_identifier = source["subscription_identifier"];
	        this.content_type = source["content_type"];
	        this.connection_id = source["connection_id"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class PayloadTemplate {
	    name: string;
	    payload: string;
	    qos: number;
	    retain: boolean;
	
	    static createFrom(source: any = {}) {
	        return new PayloadTemplate(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.payload = source["payload"];
	        this.qos = source["qos"];
	        this.retain = source["retain"];
	    }
	}
	export class PublishHistoryHeader {
	    topic: string;
	    qos: number;
	    retain: boolean;
	    connection_id: string;
	
	    static createFrom(source: any = {}) {
	        return new PublishHistoryHeader(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.topic = source["topic"];
	        this.qos = source["qos"];
	        this.retain = source["retain"];
	        this.connection_id = source["connection_id"];
	    }
	}
	export class PublishHistoryPayload {
	    payload: string;
	    payload_type: string;
	    connection_id: string;
	
	    static createFrom(source: any = {}) {
	        return new PublishHistoryPayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.payload = source["payload"];
	        this.payload_type = source["payload_type"];
	        this.connection_id = source["connection_id"];
	    }
	}
	
	export class Settings {
	    id: string;
	    width: number;
	    height: number;
	    auto_check: boolean;
	    current_lang: string;
	    current_theme: string;
	    max_reconnect_times: number;
	    auto_resub: boolean;
	    sync_os_theme: boolean;
	    multi_topics: boolean;
	    json_highlight: boolean;
	    enable_copilot: boolean;
	    open_ai_api_host: string;
	    open_ai_api_key: string;
	    model: string;
	    log_level: string;
	    ignore_qos0_message: boolean;
	    payload_templates?: PayloadTemplate[];
	    last_connection_id?: string;
	    topic_aliases?: Record<string, string>;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.width = source["width"];
	        this.height = source["height"];
	        this.auto_check = source["auto_check"];
	        this.current_lang = source["current_lang"];
	        this.current_theme = source["current_theme"];
	        this.max_reconnect_times = source["max_reconnect_times"];
	        this.auto_resub = source["auto_resub"];
	        this.sync_os_theme = source["sync_os_theme"];
	        this.multi_topics = source["multi_topics"];
	        this.json_highlight = source["json_highlight"];
	        this.enable_copilot = source["enable_copilot"];
	        this.open_ai_api_host = source["open_ai_api_host"];
	        this.open_ai_api_key = source["open_ai_api_key"];
	        this.model = source["model"];
	        this.log_level = source["log_level"];
	        this.ignore_qos0_message = source["ignore_qos0_message"];
	        this.payload_templates = this.convertValues(source["payload_templates"], PayloadTemplate);
	        this.last_connection_id = source["last_connection_id"];
	        this.topic_aliases = source["topic_aliases"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Subscription {
	    id: string;
	    topic: string;
	    qos: number;
	    disabled: boolean;
	    alias?: string;
	    retain: boolean;
	    nl: boolean;
	    rap: boolean;
	    rh: number;
	    subscription_identifier?: number;
	    user_properties?: Record<string, string>;
	    color?: string;
	    // Go type: time
	    created_at: any;
	    connection_id: string;
	
	    static createFrom(source: any = {}) {
	        return new Subscription(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.topic = source["topic"];
	        this.qos = source["qos"];
	        this.disabled = source["disabled"];
	        this.alias = source["alias"];
	        this.retain = source["retain"];
	        this.nl = source["nl"];
	        this.rap = source["rap"];
	        this.rh = source["rh"];
	        this.subscription_identifier = source["subscription_identifier"];
	        this.user_properties = source["user_properties"];
	        this.color = source["color"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.connection_id = source["connection_id"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace mqtt {
	
	export class ConnectionStats {
	    connectionId: string;
	    messagesSent: number;
	    messagesReceived: number;
	    bytesSent: number;
	    bytesReceived: number;
	    connectedAt?: string;
	    lastLatencyMs: number;
	    avgLatencyMs: number;
	    latencySamples: number;
	    lastError?: string;
	    reconnectCount: number;
	
	    static createFrom(source: any = {}) {
	        return new ConnectionStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.connectionId = source["connectionId"];
	        this.messagesSent = source["messagesSent"];
	        this.messagesReceived = source["messagesReceived"];
	        this.bytesSent = source["bytesSent"];
	        this.bytesReceived = source["bytesReceived"];
	        this.connectedAt = source["connectedAt"];
	        this.lastLatencyMs = source["lastLatencyMs"];
	        this.avgLatencyMs = source["avgLatencyMs"];
	        this.latencySamples = source["latencySamples"];
	        this.lastError = source["lastError"];
	        this.reconnectCount = source["reconnectCount"];
	    }
	}

}

