using System;
using System.IO.Ports;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace LighTouch.Services
{
    public class BluetoothHandler : IDisposable
    {
        private SerialPort _serialPort;
        private CancellationTokenSource _cancellationTokenSource;
        private bool _isRunning;
        private string _currentPortName;

        public event EventHandler<string> MessageReceived;

        public BluetoothHandler()
        {
            _cancellationTokenSource = new CancellationTokenSource();
        }

        public async Task StartAsync()
        {
            _isRunning = true;
            await Task.Run(() => ConnectionLoop(_cancellationTokenSource.Token));
        }

        private async void ConnectionLoop(CancellationToken cancellationToken)
        {
            while (_isRunning && !cancellationToken.IsCancellationRequested)
            {
                try
                {
                    if (_serialPort == null || !_serialPort.IsOpen)
                    {
                        string portName = FindBluetoothPort();
                        if (!string.IsNullOrEmpty(portName))
                        {
                            ConnectToPort(portName);
                        }
                        else
                        {
                            Console.WriteLine("No Bluetooth COM port found. Retrying in 10 seconds...");
                            await Task.Delay(10000, cancellationToken);
                            continue;
                        }
                    }

                    // Read data from serial port
                    if (_serialPort != null && _serialPort.IsOpen && _serialPort.BytesToRead > 0)
                    {
                        string data = _serialPort.ReadLine();
                        if (!string.IsNullOrWhiteSpace(data))
                        {
                            OnMessageReceived(data.Trim());
                        }
                    }

                    await Task.Delay(50, cancellationToken); // Small delay to avoid busy waiting
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Bluetooth error: {ex.Message}");
                    ClosePort();
                    await Task.Delay(10000, cancellationToken);
                }
            }
        }

        private string FindBluetoothPort()
        {
            try
            {
                string[] ports = SerialPort.GetPortNames();

                // Try to find a Bluetooth COM port
                // On Windows, Bluetooth devices often show up as COM ports
                foreach (string port in ports)
                {
                    try
                    {
                        // Try to open the port temporarily to check if it's available
                        using (SerialPort testPort = new SerialPort(port))
                        {
                            testPort.BaudRate = 9600;
                            testPort.Open();
                            testPort.Close();

                            // If we can open it, return it
                            // You might want to add more specific logic here to identify
                            // the correct Bluetooth device
                            Console.WriteLine($"Found available port: {port}");
                            return port;
                        }
                    }
                    catch
                    {
                        // Port not available or not the right one
                        continue;
                    }
                }

                // If no port found automatically, return the first available port
                return ports.FirstOrDefault();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error finding Bluetooth port: {ex.Message}");
                return null;
            }
        }

        private void ConnectToPort(string portName)
        {
            try
            {
                _serialPort = new SerialPort(portName)
                {
                    BaudRate = 9600,
                    Parity = Parity.None,
                    DataBits = 8,
                    StopBits = StopBits.One,
                    Handshake = Handshake.None,
                    ReadTimeout = 500,
                    WriteTimeout = 500
                };

                _serialPort.Open();
                _currentPortName = portName;
                Console.WriteLine($"Connected to Bluetooth device on {portName}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error connecting to {portName}: {ex.Message}");
                _serialPort = null;
            }
        }

        private void ClosePort()
        {
            try
            {
                if (_serialPort != null && _serialPort.IsOpen)
                {
                    _serialPort.Close();
                }
                _serialPort?.Dispose();
                _serialPort = null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error closing port: {ex.Message}");
            }
        }

        public void SendMessage(string message)
        {
            try
            {
                if (_serialPort != null && _serialPort.IsOpen)
                {
                    _serialPort.WriteLine(message);
                }
                else
                {
                    Console.WriteLine("Cannot send message: Port not open");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending message: {ex.Message}");
            }
        }

        protected virtual void OnMessageReceived(string message)
        {
            MessageReceived?.Invoke(this, message);
        }

        public void Dispose()
        {
            _isRunning = false;
            _cancellationTokenSource?.Cancel();
            ClosePort();
            _cancellationTokenSource?.Dispose();
        }
    }
}
