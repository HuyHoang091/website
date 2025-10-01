@echo off
cd /d C:\xampp\htdocs\hoanghuy\project\frontend

start cmd /k "npm start"

cd /d C:\xampp\htdocs\hoanghuy\project\backend

start cmd /k "mvn clean spring-boot:run"
