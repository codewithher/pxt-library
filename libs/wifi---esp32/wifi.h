#pragma once

#include "pxt.h"
#include "esp_log.h"

namespace pxt {
// nothing here yet
} // namespace pxt

namespace _wifi {
    int eventID();
    void startHttpServer(const char* hostName);
}