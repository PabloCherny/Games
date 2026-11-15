const terminal = document.getElementById('terminal-output');
const input = document.getElementById('terminal-input');
let isRunning = false;

const commandHistory = [];
let historyIndex = 0; 

input.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            input.value = commandHistory[historyIndex];
        }
        return;
    }

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            input.value = commandHistory[historyIndex];
        } else {
            historyIndex = commandHistory.length;
            input.value = '';
        }
        return;
    }

    if (e.key === 'Enter') {
        const command = input.value.trim();
        input.value = ''; 
        
        if (command === '') return;

        if (commandHistory[commandHistory.length - 1] !== command) {
            commandHistory.push(command);
        }
        historyIndex = commandHistory.length;

        print(`<span style="color: #27c93f;">zveig@MyNewLaptop</span>:<span style="color: #569cd6;">~/weather_docker</span>$ ${command}`);
        
        processCommand(command);
    }
});

function print(text, className = '') {
    const div = document.createElement('div');
    div.className = className;
    div.innerHTML = text;
    terminal.appendChild(div);
    terminal.scrollTop = terminal.scrollHeight;
}

function processCommand(cmd) {
    const args = cmd.split(' ').filter(arg => arg !== '');
    const baseCmd = args[0];

    switch (baseCmd) {
        case 'help':
            print("Доступные команды:");
            print("  ls                           - показать файлы в текущей папке");
            print("  docker compose up -d --build - собрать и запустить контейнеры");
            print("  docker ps                    - показать запущенные контейнеры");
            print("  curl localhost:8080          - сделать запрос к веб-серверу");
            print("  clear                        - очистить экран");
            print("  history                      - показать историю команд");
            break;
            
        case 'history':
            print("История команд:");
            commandHistory.forEach((cmd, index) => {
                print(`  ${index + 1}  ${cmd}`);
            });
            break;

        case 'ls':
            print("Dockerfile  docker-compose.yml  site/");
            break;

        case 'clear':
            terminal.innerHTML = '';
            break;

        case 'docker':
            if (args[1] === 'compose' && args.includes('up')) {
                simulateBuild();
            } else if (args[1] === 'ps') {
                if (!isRunning) {
                    print("CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES");
                } else {
                    print("CONTAINER ID   IMAGE                           STATUS         PORTS                    NAMES");
                    print("a1b2c3d4e5f6   weather_game-game               Up 2 minutes   0.0.0.0:8090->80/tcp     weather_quest_game", "success");
                }
            } else {
                print(`docker: '${args.slice(1).join(' ')}' is not a docker command.`, "error");
            }
            break;

        case 'curl':
            if (isRunning) {
                const weatherOptions = [
                    { temp: "+15°C", desc: "Ясно", icon: "☀️", color: "#4CAF50" },
                    { temp: "-5°C", desc: "Снег", icon: "❄️", color: "#2196F3" },
                    { temp: "+8°C", desc: "Дождь", icon: "🌧️", color: "#607D8B" },
                    { temp: "+22°C", desc: "Переменная облачность", icon: "⛅", color: "#FFC107" },
                    { temp: "-15°C", desc: "Сильный снег", icon: "🌨️", color: "#00BCD4" },
                    { temp: "+30°C", desc: "Жара", icon: "🔥", color: "#FF5722" }
                ];

                const randomWeather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];

                print("HTTP/1.1 200 OK");
                print("Server: nginx/1.25.3");
                print("Content-Type: text/html");
                print("...");
                print(`<div style='color:${randomWeather.color}; font-size: 24px;'>${randomWeather.icon} Погода: ${randomWeather.temp}, ${randomWeather.desc}</div>`);
                print("<div>Данные получены из контейнера proxy!</div>", "success");
            } else {
                print("curl: (7) Failed to connect to localhost port 8080 after 0 ms: Connection refused", "error");
            }
            break;

        default:
            print(`bash: ${baseCmd}: command not found`, "error");
    }
}

function simulateBuild() {
    if (isRunning) {
        print("Все контейнеры уже запущены.", "warn");
        return;
    }
    print("Сборка образов...", "info");
    setTimeout(() => {
        print("[+] Building 2.4s (8/8) FINISHED", "success");
        print(" => [internal] load build definition from Dockerfile");
        print(" => [internal] load metadata for docker.io/library/nginx:alpine");
        print(" => [1/2] FROM docker.io/library/nginx:alpine");
        print(" => [2/2] COPY site/ /usr/share/nginx/html/");
        print(" => exporting to image");
        print(" => naming to docker.io/library/weather_game-game:latest");
        setTimeout(() => {
            print("[+] Running 1/1", "success");
            print(" ✔ Container weather_quest_game  Started", "success");
            print("");
            print("Игра успешно запущена! Попробуй команду: curl localhost:8080", "info");
            isRunning = true;
        }, 1000);
    }, 1500);
}
