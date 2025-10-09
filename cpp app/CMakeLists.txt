cmake_minimum_required(VERSION 3.16)
project(LighTouch VERSION 1.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

# Find Qt6
find_package(Qt6 REQUIRED COMPONENTS Core Widgets Gui SerialPort Network)

# Include directories
include_directories(
    ${CMAKE_SOURCE_DIR}/include
    ${CMAKE_SOURCE_DIR}/include/gui
    ${CMAKE_SOURCE_DIR}/include/bluetooth
    ${CMAKE_SOURCE_DIR}/include/core
    ${CMAKE_SOURCE_DIR}/include/utils
)

# Source files
set(SOURCES
    src/main.cpp
    src/gui/MainWindow.cpp
    src/gui/CalibrationWindow.cpp
    src/gui/SettingsWindow.cpp
    src/gui/OnboardingWindow.cpp
    src/gui/KeyBindingsWindow.cpp
    src/gui/ToastWidget.cpp
    src/bluetooth/BluetoothManager.cpp
    src/bluetooth/WindowsBluetooth.cpp
    src/bluetooth/LinuxBluetooth.cpp
    src/core/DeviceController.cpp
    src/core/ActionManager.cpp
    src/utils/MessageBuilder.cpp
    src/utils/Settings.cpp
    src/utils/ScreenReader.cpp
)

# Header files
set(HEADERS
    include/gui/MainWindow.h
    include/gui/CalibrationWindow.h
    include/gui/SettingsWindow.h
    include/gui/OnboardingWindow.h
    include/gui/KeyBindingsWindow.h
    include/gui/ToastWidget.h
    include/bluetooth/BluetoothManager.h
    include/bluetooth/WindowsBluetooth.h
    include/bluetooth/LinuxBluetooth.h
    include/core/DeviceController.h
    include/core/ActionManager.h
    include/utils/MessageBuilder.h
    include/utils/Settings.h
    include/utils/ScreenReader.h
)

# Resources
set(RESOURCES
    resources/resources.qrc
)

# Create executable
add_executable(${PROJECT_NAME} WIN32
    ${SOURCES}
    ${HEADERS}
    ${RESOURCES}
)

# Link Qt libraries
target_link_libraries(${PROJECT_NAME}
    Qt6::Core
    Qt6::Widgets
    Qt6::Gui
    Qt6::SerialPort
    Qt6::Network
)

# Platform-specific libraries
if(WIN32)
    target_link_libraries(${PROJECT_NAME} ws2_32 Bthprops)
elseif(UNIX AND NOT APPLE)
    target_link_libraries(${PROJECT_NAME} bluetooth)
endif()

# Set application icon
if(WIN32)
    set_target_properties(${PROJECT_NAME} PROPERTIES
        WIN32_EXECUTABLE TRUE
    )
endif()

# Installation
install(TARGETS ${PROJECT_NAME}
    RUNTIME DESTINATION bin
)
