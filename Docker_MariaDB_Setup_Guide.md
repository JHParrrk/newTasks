# Docker와 MariaDB 설치 및 명령어 가이드

이 문서는 Docker를 사용하여 MariaDB 컨테이너를 설정하고, 기본적인 MariaDB 명령어를 사용하는 전체 과정을 정리합니다.

---

### 1. Docker: MariaDB 이미지 받고 컨테이너 실행하기

먼저 Docker Hub에서 공식 MariaDB 이미지를 받고, 컨테이너로 실행합니다.

```bash
# 1. 최신 MariaDB 이미지 받기
docker pull mariadb

# 2. 컨테이너 실행하기
docker run --name mariadb -d -p 3306:3306 --restart=always -e MYSQL_ROOT_PASSWORD=root mariadb
```

**`docker run` 명령어 옵션 설명:**

- `--name mariadb`: 컨테이너의 이름을 "mariadb"로 지정하여 쉽게 접근할 수 있게 합니다.
- `-d`: 컨테이너를 백그라운드에서 실행합니다 (detached 모드).
- `-p 3306:3306`: 내 컴퓨터의 3306번 포트와 컨테이너의 3306번 포트를 연결합니다.
- `--restart=always`: 컨테이너가 어떤 이유로든 중지될 경우, 자동으로 다시 시작시킵니다.
- `-e MYSQL_ROOT_PASSWORD=root`: root 사용자의 비밀번호를 'root'로 설정합니다. **(주의: 실제 서비스에서는 절대 'root' 같은 간단한 비밀번호를 사용하면 안 됩니다!)**

---

### 2. MariaDB 접속하기

컨테이너가 실행되면, 아래 명령어로 MariaDB 셸(명령어 입력창)에 접속할 수 있습니다.

```bash
# 1. 실행 중인 컨테이너의 내부 셸(bash)로 접속
docker exec -it mariadb /bin/bash

# 2. 컨테이너 내부로 들어온 후, MariaDB에 로그인
mariadb -u root -p
# (비밀번호를 입력하라는 메시지가 나오면 위에서 설정한 'root'를 입력합니다)
```

---

### 3. 필수 MariaDB 명령어 모음 (MariaDB 셸 내부)

MariaDB 셸에 로그인한 상태에서 사용하는 가장 기본적인 명령어들입니다.

```sql
-- 모든 데이터베이스 목록 보기
SHOW DATABASES;

-- 새 데이터베이스 생성 (예: 'my_app'이라는 이름으로)
CREATE DATABASE my_app;

-- 사용할 데이터베이스로 전환
USE my_app;

-- 현재 데이터베이스의 모든 테이블 목록 보기
SHOW TABLES;

-- 예시로 'users' 테이블 생성하기
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 테이블 구조 확인하기
DESCRIBE users;
-- 또는 축약형으로:
DESC users;

-- ⭐️ 테이블 구조 변경하기 (ALTER TABLE)
-- (방금 'img_path'를 추가했던 것과 같은 작업들)

-- 1. 새 컬럼 추가하기 (테이블의 맨 뒤에 추가됨)
ALTER TABLE users ADD COLUMN last_login_ip VARCHAR(50);

-- 2. 특정 위치에 새 컬럼 추가하기 (예: 'username' 컬럼 뒤에)
ALTER TABLE users ADD COLUMN real_name VARCHAR(100) AFTER username;

-- 3. 기존 컬럼의 타입이나 속성 변경하기 (예: email 컬럼을 더 길게)
ALTER TABLE users MODIFY COLUMN email VARCHAR(200);

-- 4. 컬럼 삭제하기
ALTER TABLE users DROP COLUMN last_login_ip;


-- 테이블에 데이터 삽입하기 (추가)
INSERT INTO users (username, email) VALUES ('JHParrrk', 'jhparrrk@example.com');

-- 테이블의 데이터 조회하기 (읽기)
SELECT * FROM users;
SELECT username, email FROM users WHERE id = 1;

-- 기존 데이터 수정하기 (갱신)
UPDATE users SET email = 'new.email@example.com' WHERE username = 'JHParrrk';

-- 테이블의 데이터 삭제하기
DELETE FROM users WHERE id = 1;

-- 외부 접속을 위한 사용자 권한 부여 (로컬에서 Node.js 등으로 접속 시 필요할 수 있음)
-- 모든 IP('%')에서의 'root' 계정 접속을 허용합니다.
GRANT ALL PRIVILEGES ON my_app.* TO 'root'@'%' IDENTIFIED BY 'root';
FLUSH PRIVILEGES;

-- MariaDB 셸 종료
EXIT;
```

MariaDB 셸에서 `EXIT;`를 실행한 후, `exit`를 한 번 더 입력하면 컨테이너 셸을 빠져나와 원래 내 컴퓨터의 터미널로 돌아옵니다.
