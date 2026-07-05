import paramiko, sys

host = '168.222.43.14'
user = 'root'
password = 'ghs30vrcu38mzmuytx9b'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=10)

cmds = [
    ("Python version", "python3 --version 2>&1"),
    ("Pip", "pip3 --version 2>&1"),
    ("curl", "curl --version | head -1"),
    ("Free RAM MB", "free -m | awk '/Mem:/ {print $7\"MB free\"}'"),
    ("Disk free", "df -h / | tail -1 | awk '{print $4}'"),
]

for label, cmd in cmds:
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=5)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    print(f"{label}: {out}")

ssh.close()
