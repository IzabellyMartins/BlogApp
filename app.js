// Carregando módulos
const express = require('express');
const { engine } = require ('express-handlebars');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const app = express();
const admin = require("./routes/admin")
const path = require('path');
const { error } = require('console');
const session = require("express-session");
const flash = require("connect-flash");
require("./models/Postagem");
const Postagem = mongoose.model("postagens")
require("./models/Categoria")
const Categoria = mongoose.model("categorias");
const usuarios = require('./routes/usuario')
const passport = require("passport")
require("./config/auth")(passport)
const db = require("./config/db")


// Configurando sessão
app.use(session({
    secret: "cursodenode",
    resave: true,
    saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

// Middleware
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error")
    res.locals.user = req.user || null;
    next()
})

// Configurando o Body Parser
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

// Configurando o handlebars
app.engine('handlebars', engine({defaultLayout: 'main', runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
},}));
app.set('view engine', 'handlebars');
app.set("views", "./views");

// Configurando o Mongoose
mongoose.Promise = global.Promise;
mongoose.connect(db.mongoURI).then(() => {
    console.log("Conectado ao mongo");
}).catch((err) => {
    console.log("Erro ao se conectar: "+err);
})

// Bootstraap (configurando os arquivos estáticos da nossa pasta public).
app.use(express.static(path.join(__dirname,"public")))

// Criando um Middlewares
app.use((req, res, next) => {
    console.log("OI EU SOU UM MIDDLEWARE!")
    next() // Vai mandar passar pra próxima requisição 
})

// Rotas

app.get('/', (req, res) => {
    Postagem.find().lean().populate("categoria").sort({data: 'desc'}).then((postagens) => {
        res.render("index", {postagens: postagens})
    }).catch((err) => {
        req.flash("error_msg", "Não foi possível carregar os posts")
        res.redirect("/404")
    })
})

app.get('/404',(req, res ) => {
    res.send('Erro 404!')

})

app.get('/postagem/:slug', (req, res) => {
    Postagem.findOne({slug: req.params.slug}).then((postagem) => {
        if(postagem){
            res.render('postagem/index', {postagem: postagem})
        }else{
            req.flash('error_msg', 'Essa postagem não existe')
            res.redirect('/')
        }
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro interno')
        res.redirect('/')
    })
});

app.get('/categorias', (req, res) => {
    Categoria.find().then((categorias) => {
        res.render("categorias/index", {categorias: categorias})
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro interno ao listar as categorias')
        res.redirect('/')
    })
})

app.get('/categorias/:slug', (req, res) => {
    Categoria.findOne({slug: req.params.slug}).then((categoria) => {
        if(categoria){
            Postagem.find({categoria: categoria._id}).then((postagens) => {
                res.render("categorias/postagens", {postagens: postagens, categoria: categoria})
            }).catch((err) => {
                req.flash('error_msg', 'Houve um erro ao listar os posts')
                res.redirect('/')
            })
        }else{
            req.flash('error_msg', 'Esta categoria não existe')
            res.redirect('/')
        }
    }).catch((err) => {
        req.flash('error_msg', 'Houve um erro interno ao carregar a página desta categoria')
        res.redirect('/')
    })
})

app.use('/usuarios', usuarios)


app.use('/admin', admin) // Com isso as rotas ganham o prefixo de ''admin''


// Servidor
const PORT = process.env.PORT || 8082
app.listen(PORT, () => {
    console.log('Servidor rodando na porta 8082!');
});