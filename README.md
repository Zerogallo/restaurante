<div align="center">

 <img src="app/src/assets/logo.jpg" />
 
 </div>
 
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-1B1F1F?style=for-the-badge&logo=expo&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)

# Restaurante App - Sistema de Pedidos Mobile

Aplicativo mobile completo para restaurantes, desenvolvido sob demanda para um cliente. Permite que clientes realizem pedidos, acompanhem o status em tempo real e tenham histórico de compras.

##  Funcionalidades

### Cliente
- ✅ **Autenticação** - Login e cadastro de usuários
- ✅ **Cardápio Digital** - Organizado por categorias (comida, sobremesa, bebida)
- ✅ **Carrinho de Compras** - Adicione/remova itens, ajuste quantidades
- ✅ **Checkout** - Escolha entre delivery ou retirada, adicione observações
- ✅ **Rastreamento de Pedidos** - Acompanhe em tempo real: `Na fila → Preparando → A caminho → Entregue`
- ✅ **Histórico** - Visualize todos os pedidos anteriores e total gasto
- ✅ **Perfil** - Dados do usuário e opção de logout

### Administração (Backend)
- ✅ **API RESTful** - Endpoints para gerenciar usuários, cardápio e pedidos
- ✅ **Atualização de Status** - Controle manual do fluxo do pedido
- ✅ **Persistência** - Dados salvos em arquivo JSON

## 🛠️ Tecnologias Utilizadas

### Frontend (Mobile)
| Tecnologia | Descrição |
|------------|-----------|
| React Native | Framework para desenvolvimento mobile |
| TypeScript | Tipagem estática |
| Expo | Ferramentas para desenvolvimento React Native |
| React Navigation | Navegação entre telas (Stack, Tabs, Material Top Tabs) |
| Context API | Gerenciamento de estado global |
| Axios | Requisições HTTP |
| AsyncStorage | Armazenamento local do token |
| @expo/vector-icons | Ícones personalizados |

### Backend
| Tecnologia | Descrição |
|------------|-----------|
| Node.js | Runtime JavaScript |
| Express | Framework para API REST |
| JWT | Autenticação via token |
| bcryptjs | Hash de senhas |
| UUID | Geração de IDs únicos |
| File System (FS) | Persistência de dados em JSON |

## Fluxo do Pedido

```bash
┌─────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│ Pending │ → │ Preparing│ → │Delivering │ → │Delivered │
│ (Na fila)│    │(Preparando)│    │(A caminho)│    │(Entregue) │
└─────────┘    └──────────┘    └───────────┘    └──────────┘
```

## Funcionalidades implementadas

· Autenticação de usuários (login/cadastro)
· Cardápio com categorias
· Carrinho de compras
· Checkout com opção de delivery
· Rastreamento de pedidos em tempo real
· Histórico de pedidos
· Perfil do usuário
· Botão de logout
· Persistência de dados
· Validações de formulário
· Loading states
· Tratamento de erros





