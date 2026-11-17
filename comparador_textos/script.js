
const texto1 = document.getElementById("texto1");
const texto2 = document.getElementById("texto2");

const resultado = document.getElementById("resultadoTexto");

const botaoComparar = document.getElementById("comparar");
const botaoLimpar = document.getElementById("limpar");
const botaoCopiar = document.getElementById("copiar");

const contador1 = document.getElementById("contador1");
const contador2 = document.getElementById("contador2");

// Conta palavras e caracteres
function contarTexto(texto) {
    const palavras = texto.trim() === ""
        ? []
        : texto.trim().split(/\s+/);

    return {
        palavras: palavras.length,
        caracteres: texto.length
    };
}

// Atualiza os contadores
function atualizarContador(campo, elemento) {
    const dados = contarTexto(campo.value);

    elemento.textContent =
        dados.palavras + " palavras | " +
        dados.caracteres + " caracteres";
}

// Adiciona uma palavra ao resultado
function adicionarPalavra(palavra, classe) {
    const span = document.createElement("span");

    span.textContent = palavra + " ";

    if (classe !== "") {
        span.className = classe;
    }

    resultado.appendChild(span);
}

// Compara as palavras mantendo sua ordem
function compararTextos(salvar = true) {
    const original = texto1.value.trim();
    const modificado = texto2.value.trim();

    resultado.textContent = "";

    if (original === "" || modificado === "") {
        resultado.textContent = "Preencha os dois textos.";
        return;
    }

    if (original === modificado) {
        resultado.textContent = "Os textos são iguais!";
        return;
    }

    const palavras1 = original.split(/\s+/);
    const palavras2 = modificado.split(/\s+/);

    const n = palavras1.length;
    const m = palavras2.length;

    // Evita comparações excessivamente grandes
    if (n * m > 1000000) {
        resultado.textContent =
            "Textos muito grandes para esta versão.";
        return;
    }

    // Matriz da maior subsequência comum (LCS)
    const matriz = [];

    for (let i = 0; i <= n; i++) {
        matriz[i] = new Array(m + 1).fill(0);
    }

    for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
            if (palavras1[i] === palavras2[j]) {
                matriz[i][j] = 1 + matriz[i + 1][j + 1];
            } else {
                matriz[i][j] = Math.max(
                    matriz[i + 1][j],
                    matriz[i][j + 1]
                );
            }
        }
    }

    let i = 0;
    let j = 0;

    while (i < n && j < m) {
        if (palavras1[i] === palavras2[j]) {
            adicionarPalavra(palavras1[i], "");
            i++;
            j++;
        } else if (matriz[i + 1][j] >= matriz[i][j + 1]) {
            adicionarPalavra(palavras1[i], "removido");
            i++;
        } else {
            adicionarPalavra(palavras2[j], "adicionado");
            j++;
        }
    }

    while (i < n) {
        adicionarPalavra(palavras1[i], "removido");
        i++;
    }

    
    while (j < m) {
        adicionarPalavra(palavras2[j], "adicionado");
        j++;
    }

    // Salva somente depois que toda a comparação terminar
    if (salvar) {
        salvarComparacao(original, modificado);
    }

}

// Limpa os campos
function limparTextos() {
    texto1.value = "";
    texto2.value = "";

    resultado.textContent = "As diferenças aparecerão aqui.";

    atualizarContador(texto1, contador1);
    atualizarContador(texto2, contador2);
}

// Copia o resultado
let tempoNotificacao;

function mostrarNotificacao(mensagem, erro = false) {
    const notificacao = document.getElementById("notificacao");

    if (!notificacao) {
        console.error("Elemento #notificacao não encontrado.");
        return;
    }

    notificacao.textContent = mensagem;

    notificacao.style.backgroundColor =
        erro ? "#dc2626" : "#16a34a";

    notificacao.classList.add("mostrar");

    clearTimeout(tempoNotificacao);

    tempoNotificacao = setTimeout(function() {
        notificacao.classList.remove("mostrar");
    }, 3000);
}

// Copia o resultado para a área de transferência
async function copiarResultado() {
    const conteudo = resultado.innerText;

    try {
        await navigator.clipboard.writeText(conteudo);

        mostrarNotificacao(
            "✓ Resultado copiado para a área de transferência!"
        );

    } catch (erro) {
        console.error("Erro ao copiar:", erro);

        mostrarNotificacao(
            "Não foi possível copiar o resultado.",
            true
        );
    }
}

// Eventos
texto1.addEventListener("input", function() {
    atualizarContador(texto1, contador1);
});

texto2.addEventListener("input", function() {
    atualizarContador(texto2, contador2);
});


botaoComparar.addEventListener("click", function() {
    compararTextos(true);
});

botaoLimpar.addEventListener("click", limparTextos);
botaoCopiar.addEventListener("click", copiarResultado);

const CHAVE_HISTORICO = "historicoComparacoes";
const LIMITE_HISTORICO = 5;

const listaHistorico = document.getElementById("listaHistorico");
const botaoLimparHistorico = document.getElementById("limparHistorico");

// Recupera o histórico salvo
function obterHistorico() {
    try {
        const dados = localStorage.getItem(CHAVE_HISTORICO);
        const historico = dados ? JSON.parse(dados) : [];

        return Array.isArray(historico) ? historico : [];
    } catch (erro) {
        console.error("Erro ao recuperar histórico:", erro);
        return [];
    }
}

// Salva uma nova comparação
function salvarComparacao(original, modificado) {
    const historico = obterHistorico();

    const comparacao = {
        id: Date.now() + "-" + Math.random(),
        textoOriginal: original,
        textoModificado: modificado,
        data: new Date().toLocaleString("pt-BR")
    };

    historico.unshift(comparacao);

    // Mantém apenas as 5 comparações mais recentes
    const historicoAtualizado = historico.slice(
        0,
        LIMITE_HISTORICO
    );

    try {
        localStorage.setItem(
            CHAVE_HISTORICO,
            JSON.stringify(historicoAtualizado)
        );

        exibirHistorico();
    } catch (erro) {
        console.error("Erro ao salvar histórico:", erro);
    }
}

// Mostra as comparações na página
function exibirHistorico() {
    const historico = obterHistorico();

    listaHistorico.innerHTML = "";

    if (historico.length === 0) {
        const mensagem = document.createElement("p");
        mensagem.textContent = "Nenhuma comparação salva.";
        listaHistorico.appendChild(mensagem);
        return;
    }

    historico.forEach(function(comparacao) {
        const item = document.createElement("div");
        item.className = "item-historico";

        const data = document.createElement("p");
        data.className = "data-historico";
        data.textContent = comparacao.data;

        const previa = document.createElement("p");
        previa.textContent =
            "Original: " +
            comparacao.textoOriginal.substring(0, 80) +
            (comparacao.textoOriginal.length > 80 ? "..." : "");

        const botoes = document.createElement("div");
        botoes.className = "botoes-historico";

        // Botão para recuperar comparação
        const recuperar = document.createElement("button");
        recuperar.textContent = "Recuperar";

        recuperar.addEventListener("click", function() {
            texto1.value = comparacao.textoOriginal;
            texto2.value = comparacao.textoModificado;

            atualizarContador(texto1, contador1);
            atualizarContador(texto2, contador2);

            compararTextos(false);

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });

        // Botão para excluir comparação
        const excluir = document.createElement("button");
        excluir.textContent = "Excluir";
        excluir.className = "btn-excluir";

        excluir.addEventListener("click", function() {
            excluirComparacao(comparacao.id);
        });

        botoes.appendChild(recuperar);
        botoes.appendChild(excluir);

        item.appendChild(data);
        item.appendChild(previa);
        item.appendChild(botoes);

        listaHistorico.appendChild(item);
    });
}

// Exclui uma comparação específica
function excluirComparacao(id) {
    const historico = obterHistorico();

    const atualizado = historico.filter(function(item) {
        return item.id !== id;
    });

    try {
        localStorage.setItem(
            CHAVE_HISTORICO,
            JSON.stringify(atualizado)
        );

        exibirHistorico();
    } catch (erro) {
        console.error("Erro ao excluir comparação:", erro);
    }
}

// Limpa todo o histórico
function limparHistorico() {
    const confirmar = confirm(
        "Deseja realmente apagar todo o histórico?"
    );

    if (confirmar) {
        localStorage.removeItem(CHAVE_HISTORICO);
        exibirHistorico();
    }
}

// Evento para limpar histórico
botaoLimparHistorico.addEventListener(
    "click",
    limparHistorico
);

// Carrega o histórico ao abrir a página
exibirHistorico();

const botaoCarregarExemplo =
    document.getElementById("carregarExemplo");

const statusExemplo =
    document.getElementById("statusExemplo");

// Busca os dados de um arquivo JSON
async function buscarExemplo(caminho) {
    const resposta = await fetch(caminho);

    if (!resposta.ok) {
        throw new Error(
            "Erro HTTP: " + resposta.status
        );
    }

    const dados = await resposta.json();

    if (typeof dados.texto !== "string") {
        throw new Error("Formato JSON inválido.");
    }

    return dados;
}

// Carrega os exemplos nos campos
async function carregarExemplo() {
    botaoCarregarExemplo.disabled = true;
    statusExemplo.textContent = "Carregando exemplos...";

    try {
        const [original, modificado] = await Promise.all([
            buscarExemplo("./dados/exemplo-original.json"),
            buscarExemplo("./dados/exemplo-modificado.json")
        ]);

        texto1.value = original.texto;
        texto2.value = modificado.texto;

        atualizarContador(texto1, contador1);
        atualizarContador(texto2, contador2);

        resultado.textContent =
            "Exemplo carregado. Clique em Comparar textos.";

        statusExemplo.textContent =
            "Exemplos carregados com sucesso!";

    } catch (erro) {
        console.error("Erro ao carregar exemplo:", erro);

        statusExemplo.textContent =
            "Erro ao carregar exemplos. Verifique os arquivos JSON.";

    } finally {
        botaoCarregarExemplo.disabled = false;
    }
}

// Evento do botão Carregar exemplo
if (botaoCarregarExemplo && statusExemplo) {
    botaoCarregarExemplo.addEventListener(
        "click",
        carregarExemplo
    );
}

const arquivo1 = document.getElementById("arquivo1");
const arquivo2 = document.getElementById("arquivo2");

const nomeArquivo1 = document.getElementById("nomeArquivo1");
const nomeArquivo2 = document.getElementById("nomeArquivo2");

const TAMANHO_MAXIMO = 1024 * 1024; // 1 MB

// Importa o conteúdo de um arquivo .txt
async function importarArquivo(input, campo, contador, nomeArquivo) {

    const arquivo = input.files[0];

    if (!arquivo) {
        return;
    }

    // Verifica a extensão
    if (!arquivo.name.toLowerCase().endsWith(".txt")) {
        alert("Selecione apenas arquivos .txt.");
        input.value = "";
        return;
    }

    // Verifica o tamanho
    if (arquivo.size > TAMANHO_MAXIMO) {
        alert("O arquivo deve ter no máximo 1 MB.");
        input.value = "";
        return;
    }

    try {
        nomeArquivo.textContent = "Importando arquivo...";

        // Lê o arquivo utilizando a File API
        const conteudo = await arquivo.text();

        // Insere o conteúdo no textarea
        campo.value = conteudo;

        // Atualiza a contagem de palavras e caracteres
        atualizarContador(campo, contador);

        // Mostra o nome do arquivo
        nomeArquivo.textContent =
            "Arquivo importado: " + arquivo.name;

        // Atualiza a mensagem de resultado
        resultado.textContent =
            "Arquivo importado. Clique em Comparar textos.";

        console.log("Arquivo importado:", arquivo.name);

    } catch (erro) {
        console.error("Erro ao importar arquivo:", erro);

        nomeArquivo.textContent =
            "Não foi possível importar o arquivo.";

    } finally {
        // Permite importar novamente o mesmo arquivo
        input.value = "";
    }
}

// Evento para importar o texto original
arquivo1.addEventListener("change", function() {
    importarArquivo(
        arquivo1,
        texto1,
        contador1,
        nomeArquivo1
    );
});

// Evento para importar o texto modificado
arquivo2.addEventListener("change", function() {
    importarArquivo(
        arquivo2,
        texto2,
        contador2,
        nomeArquivo2
    );
});



