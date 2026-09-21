const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// CONFIGURAÇÕES
// =========================

app.use(cors());
app.use(express.json());

const FRONTEND_DIR = path.join(__dirname, "../frontend");
const DB_FILE = path.join(__dirname, "db.json");

app.use(express.static(FRONTEND_DIR));

// =========================
// BANCO DE DADOS
// =========================

function bancoInicial() {
  return {
    usuarios: [],
    pacientes: [],
    triagens: [],
    consultas: [],
    tv_chamada: null,
    tv_historico: []
  };
}

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const db = bancoInicial();
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
      return db;
    }

    const conteudo = fs.readFileSync(DB_FILE, "utf8");

    if (!conteudo.trim()) {
      const db = bancoInicial();
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
      return db;
    }

    const db = JSON.parse(conteudo);

    if (!db.usuarios) db.usuarios = [];
    if (!db.pacientes) db.pacientes = [];
    if (!db.triagens) db.triagens = [];
    if (!db.consultas) db.consultas = [];
    if (!db.tv_chamada) db.tv_chamada = null;
    if (!db.tv_historico) db.tv_historico = [];

    return db;
  } catch (erro) {
    console.error("Erro ao ler banco:", erro);
    return bancoInicial();
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(data, null, 2)
    );
  } catch (erro) {
    console.error("Erro ao salvar banco:", erro);
  }
}

// =========================
// TESTE DO SERVIDOR
// =========================

app.get("/api/status", (req, res) => {
  res.json({
    online: true,
    mensagem: "Servidor do Hospital Pro funcionando!",
    porta: PORT
  });
});

// =========================
// LOGIN
// =========================

app.post("/login", (req, res) => {
  const db = readDB();

  const { usuario, senha } = req.body;

  const user = db.usuarios.find(
    u =>
      u.usuario === usuario &&
      u.senha === senha
  );

  if (!user) {
    return res.status(401).json({
      erro: "Login inválido"
    });
  }

  res.json(user);
});

// =========================
// ATENDIMENTO
// =========================

app.post("/atendimento", (req, res) => {
  const db = readDB();

  const paciente = {
    id: Date.now(),
    nome: req.body.nome || "",
    cpf: req.body.cpf || "",
    tipo: req.body.tipo || "",
    status: "triagem",
    createdAt: new Date().toISOString()
  };

  db.pacientes.push(paciente);

  writeDB(db);

  res.status(201).json(paciente);
});

app.get("/pacientes", (req, res) => {
  const db = readDB();

  res.json(db.pacientes);
});

// =========================
// TRIAGEM
// =========================

app.post("/triagem", (req, res) => {
  const db = readDB();

  let risco = req.body.risco;

  const temperatura = Number(req.body.temperatura);

  if (temperatura >= 39) {
    risco = "vermelho";
  } else if (temperatura >= 38) {
    risco = "amarelo";
  } else if (!risco) {
    risco = "verde";
  }

  const triagem = {
    id: Date.now(),
    nome: req.body.nome || "",
    sintoma: req.body.sintoma || "",
    temperatura: temperatura || 0,
    alergia: req.body.alergia || "",
    observacao: req.body.observacao || "",
    risco: risco,
    status: "aguardando_medico",
    createdAt: new Date().toISOString()
  };

  db.triagens.push(triagem);

  writeDB(db);

  res.status(201).json(triagem);
});

app.get("/triagens", (req, res) => {
  const db = readDB();

  res.json(db.triagens);
});

// =========================
// CHAMADA DA TV
// =========================

app.post("/tv/chamar", (req, res) => {
  const db = readDB();

  const chamada = {
    id: Date.now().toString(),
    localTipo: req.body.localTipo || "",
    localNumero: req.body.localNumero || "",
    paciente: req.body.paciente || "",
    hora: new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    })
  };

  db.tv_chamada = chamada;

  db.tv_historico.unshift(chamada);

  if (db.tv_historico.length > 5) {
    db.tv_historico.pop();
  }

  writeDB(db);

  res.json(chamada);
});

app.get("/tv/chamada", (req, res) => {
  const db = readDB();

  res.json({
    chamada: db.tv_chamada,
    historico: db.tv_historico
  });
});

// =========================
// MEDICAÇÕES
// =========================

app.get("/lista-medicacoes", (req, res) => {
  res.json([
    "Dipirona",
    "Paracetamol",
    "Ibuprofeno",
    "Amoxicilina",
    "Azitromicina",
    "Loratadina",
    "Omeprazol",
    "Buscopan",
    "Dramin",
    "Soro fisiológico"
  ]);
});

// =========================
// CONSULTA MÉDICA
// =========================

app.post("/consulta", (req, res) => {
  const db = readDB();

  const consulta = {
    id: Date.now(),
    paciente: req.body.paciente || "",
    diagnostico: req.body.diagnostico || "",
    medicacao: req.body.medicacao || "",
    obs: req.body.obs || "",
    createdAt: new Date().toISOString()
  };

  db.consultas.push(consulta);

  writeDB(db);

  res.status(201).json(consulta);
});

app.get("/medicacoes", (req, res) => {
  const db = readDB();

  res.json(db.consultas);
});

// =========================
// FRONTEND
// =========================

app.get("/", (req, res) => {
  res.sendFile(
    path.join(FRONTEND_DIR, "index.html")
  );
});

// =========================
// INICIAR SERVIDOR
// =========================

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🏥 Hospital Pro rodando na porta ${PORT}`
  );
});
