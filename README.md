# MicroservicesProject
## Alayoubi medical point is a patient management system that uses microservices architecture and contains the following services and components:
### Registry Server (Consul): to register entire services.
### API Gateway (api-gateway service): to forward request to the wanted service.
### Auth service: to handle user information, authintecation and autherization operations.
### Patient service: to handle patient informatins, daily visits and register it.
### Other services.

# How To Run This Project?
## 1. Run Consul server using this command: consul agent -dev -ui -client=0.0.0.0
## 2- Run api-gateway service:
### node index
## 3- Run auth-service:
### node index
## 4- Run patient-service:
### node index
### Run other services.
