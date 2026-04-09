#pragma once

#include <string>
#include <vector>
#include <fstream>
#include <sstream>
#include <iostream>
#include <iomanip>
#include <map>

/**
 * JsonLogger - Base logging class for MathlabX engines
 *
 * OOP Concepts demonstrated:
 * - Encapsulation: internal log state is private, exposed via public API
 * - Inheritance: engines extend this class to gain logging capability
 * - Polymorphism: flush() and toString() can be overridden
 * - Abstraction: callers don't care how JSON is built internally
 */
class JsonLogger {
public:
    // A single key-value log entry (value stored as raw JSON string)
    struct Entry {
        std::string key;
        std::string value; // already JSON-serialized
    };

    explicit JsonLogger(const std::string& componentName);
    virtual ~JsonLogger() = default;

    // --- Logging API ---
    void logString(const std::string& key, const std::string& value);
    void logDouble(const std::string& key, double value, int precision = 6);
    void logInt(const std::string& key, int value);
    void logBool(const std::string& key, bool value);
    void logRaw(const std::string& key, const std::string& rawJson); // for nested objects/arrays

    // --- Output ---
    virtual std::string toString() const;          // returns JSON string
    virtual void printToConsole() const;           // prints to stdout
    virtual bool flush(const std::string& filepath) const; // writes to file

    // --- Metadata ---
    const std::string& getComponentName() const;
    void setTimestamp(const std::string& ts);

protected:
    std::string componentName_;
    std::string timestamp_;
    std::vector<Entry> entries_;

private:
    std::string buildJson() const;
    static std::string escapeString(const std::string& s);
};