#include "JsonLogger.h"
#include <stdexcept>

// ============================================================
// Constructor
// ============================================================
JsonLogger::JsonLogger(const std::string& componentName)
    : componentName_(componentName), timestamp_("") {}

// ============================================================
// Logging API
// ============================================================
void JsonLogger::logString(const std::string& key, const std::string& value) {
    entries_.push_back({key, "\"" + escapeString(value) + "\""});
}

void JsonLogger::logDouble(const std::string& key, double value, int precision) {
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(precision) << value;
    entries_.push_back({key, oss.str()});
}

void JsonLogger::logInt(const std::string& key, int value) {
    entries_.push_back({key, std::to_string(value)});
}

void JsonLogger::logBool(const std::string& key, bool value) {
    entries_.push_back({key, value ? "true" : "false"});
}

void JsonLogger::logRaw(const std::string& key, const std::string& rawJson) {
    entries_.push_back({key, rawJson});
}

// ============================================================
// Output
// ============================================================
std::string JsonLogger::toString() const {
    return buildJson();
}

void JsonLogger::printToConsole() const {
    std::cout << buildJson() << std::endl;
}

bool JsonLogger::flush(const std::string& filepath) const {
    std::ofstream file(filepath);
    if (!file.is_open()) {
        std::cerr << "[JsonLogger] ERROR: Could not open file: " << filepath << std::endl;
        return false;
    }
    file << buildJson();
    file.close();
    std::cout << "[JsonLogger] Flushed \"" << componentName_ << "\" -> " << filepath << std::endl;
    return true;
}

// ============================================================
// Metadata
// ============================================================
const std::string& JsonLogger::getComponentName() const {
    return componentName_;
}

void JsonLogger::setTimestamp(const std::string& ts) {
    timestamp_ = ts;
}

// ============================================================
// Private helpers
// ============================================================
std::string JsonLogger::buildJson() const {
    std::ostringstream json;
    json << "{\n";
    json << "  \"component\": \"" << escapeString(componentName_) << "\"";

    if (!timestamp_.empty()) {
        json << ",\n  \"timestamp\": \"" << escapeString(timestamp_) << "\"";
    }

    for (const auto& entry : entries_) {
        json << ",\n  \"" << escapeString(entry.key) << "\": " << entry.value;
    }

    json << "\n}";
    return json.str();
}

std::string JsonLogger::escapeString(const std::string& s) {
    std::string out;
    out.reserve(s.size());
    for (char c : s) {
        switch (c) {
            case '"':  out += "\\\""; break;
            case '\\': out += "\\\\"; break;
            case '\n': out += "\\n";  break;
            case '\r': out += "\\r";  break;
            case '\t': out += "\\t";  break;
            default:   out += c;      break;
        }
    }
    return out;
}