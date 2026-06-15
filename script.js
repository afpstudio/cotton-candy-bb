// Espera todo o HTML ser carregado antes de executar o JavaScript
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. GERAÇÃO AUTOMÁTICA DE IDS (DEEP LINKING) ---
    // Percorre os produtos e cria IDs baseados na "Ref" escrita no título.
    // Isso permite links como: seudominio.com/produtos.html#ref05
    const produtosParaId = document.querySelectorAll('.card, .product-card');
    produtosParaId.forEach((card, index) => {
        if (!card.id) { // Só gera se o card ainda não tiver um ID manual
            const titulo = card.querySelector('h2, h3')?.innerText || "";
            const match = titulo.match(/ref\.?\s*(\d+)/i); // Procura por "Ref" + números
            if (match) {
                card.id = `ref${match[1]}`.toLowerCase(); // Ex: transforma "Ref 02" em id="ref02"
            } else {
                card.id = `prod-${index}`; // Fallback caso não tenha "Ref" no título
            }
        }
    });

    // --- 1. CONFIGURAÇÃO INICIAL DO CARRINHO ---
    
    // Tenta buscar o carrinho salvo no navegador (localStorage). Se não existir, começa com uma lista vazia [].
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

    // Seleciona os elementos da página que vamos manipular
    const botoesComprar = document.querySelectorAll('.card button, .product-card button');
    const carrinhoContainer = document.getElementById('itens-carrinho');
    const totalElemento = document.getElementById('valor-total');

    // Função auxiliar para converter números (ex: 89.9) no formato de moeda (R$ 89,90)
    const formatarMoeda = (valor) => {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Função que "desenha" os itens dentro da barra lateral do carrinho
    const atualizarInterfaceCarrinho = () => {
        if (!carrinhoContainer || !totalElemento) return;

        carrinhoContainer.innerHTML = ''; // Limpa a lista atual para não duplicar
        let total = 0;

        // Percorre cada item que está no carrinho
        carrinho.forEach((item, index) => {
            total += item.preco * item.quantidade; // Soma o valor ao total
            
            const div = document.createElement('div');
            div.className = 'item-carrinho';
            
            // Cria o HTML de cada linha do carrinho
            div.innerHTML = `
                <div>
                    <strong>${item.nome}</strong><br>
                    ${item.quantidade}x ${formatarMoeda(item.preco)}
                </div>
                <!-- Link individual para o Mercado Livre salvo no item -->
                <a href="${item.link}" target="_blank" style="text-decoration:none; font-size:0.7rem; color:#6db3f8;">Ver no ML</a>
                <button onclick="removerDoCarrinho(${index})" class="btn-remover">&times;</button>
            `;
            carrinhoContainer.appendChild(div);
        });

        // Atualiza o valor total na tela e salva a lista atualizada no navegador
        totalElemento.innerText = formatarMoeda(total);
        localStorage.setItem('carrinho', JSON.stringify(carrinho));
    };

    // --- 2. LÓGICA DE ADICIONAR PRODUTOS ---

    botoesComprar.forEach((botao) => {
        botao.addEventListener('click', (e) => {
            // Impede que o clique no botão abra o modal de detalhes
            e.stopPropagation();
            
            // Sobe na hierarquia do HTML para achar o card que contém o botão clicado
            const container = botao.closest('.card') || botao.closest('.product-card');
            if (!container) return;

            // Busca as informações de texto. Usamos .preco especificamente para não pegar a descrição.
            const nomeElem = container.querySelector('h2, h3');
            const precoElem = container.querySelector('.preco'); 

            if (!nomeElem || !precoElem) return;

            const nomeProduto = nomeElem.innerText;
            const precoTexto = precoElem.innerText;
            
            // Pega o link do Mercado Livre que está escondido no atributo 'data-link' do botão
            const linkML = botao.getAttribute('data-link') || "https://www.mercadolivre.com.br/";
            
            // Converte o texto "R$ 89,90" em um número real 89.90
            const preco = parseFloat(precoTexto.replace(/[^\d,]/g, '').replace(',', '.'));

            // Lógica de Estoque
            const estoqueMax = parseInt(container.getAttribute('data-estoque')) || 1;
            const itemExistente = carrinho.find(item => item.nome === nomeProduto);
            const qtdNoCarrinho = itemExistente ? itemExistente.quantidade : 0;

            if (!isNaN(preco)) {
                if (qtdNoCarrinho >= estoqueMax) {
                    alert("Desculpe, não temos mais unidades deste produto em estoque.");
                    return;
                }

                if (itemExistente) {
                    itemExistente.quantidade++; // Apenas aumenta a contagem
                } else {
                    // Adiciona um novo objeto à lista
                    carrinho.push({ nome: nomeProduto, preco: preco, quantidade: 1, link: linkML });
                }

                atualizarInterfaceCarrinho(); // Atualiza a tela
                abrirCarrinho(); // Abre a aba lateral para o usuário ver que funcionou
            }
        });
    });

    // --- 3. FINALIZAÇÃO DA COMPRA ---

    const btnFinalizar = document.querySelector('.carrinho-footer button');
    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', () => {
            if (carrinho.length === 0) {
                alert("Seu carrinho está vazio!");
                return;
            }

            // Se houver só 1 produto, abre o link direto dele no ML.
            // Se houver vários, abre a sua loja geral no ML.
            if (carrinho.length === 1) {
                window.open(carrinho[0].link, '_blank');
            } else {
                const linkLojaML = "https://lista.mercadolivre.com.br/_CustId_529386639?item_id=MLB6778651416&category_id=MLB28129&seller_id=529386639&client=recoview-selleritems&recos_listing=true"; 
                alert("Para múltiplos itens, você será redirecionado para nossa loja oficial no Mercado Livre!");
                window.open(linkLojaML, '_blank');
            }
        });
    }

    // --- 4. FUNÇÕES DE UTILIDADE ---

    // Remove um item do array usando o índice (posição na lista)
    window.removerDoCarrinho = (index) => {
        carrinho.splice(index, 1);
        atualizarInterfaceCarrinho();
    };

    // Gerenciamento visual da barra lateral (adiciona/remove classes do CSS)
    const sidebar = document.getElementById('carrinho-lateral');
    const abrirCarrinho = () => sidebar?.classList.add('aberto');
    window.toggleCarrinho = () => sidebar?.classList.toggle('aberto');

    // Carrega o carrinho assim que a página abre
    atualizarInterfaceCarrinho();

    // --- 5. MENU MOBILE (HAMBÚRGUER) ---

    const btnMobile = document.getElementById('btn-mobile');
    const nav = document.querySelector('nav');

    if (btnMobile && nav) {
        btnMobile.addEventListener('click', (e) => {
            if (e.currentTarget.tagName === 'A') e.preventDefault();
            
            nav.classList.toggle('active'); // Alterna a visualização do menu
            
            const isActive = nav.classList.contains('active');
            btnMobile.setAttribute('aria-expanded', isActive);
            
            btnMobile.setAttribute('aria-label', isActive ? 'Fechar Menu' : 'Abrir Menu');
        });

        // Fecha o menu ao clicar em qualquer link (útil para Single Page ou UX melhor)
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
            });
        });
    }

    // --- 6. EFEITOS VISUAIS ---

    // Adiciona uma sombra no topo do site quando você rola a página para baixo
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }
    }, { passive: true }); // passive: true torna a rolagem mais suave no celular

    // --- 7. LÓGICA DE FILTRO DE PRODUTOS ---
    const botoesFiltro = document.querySelectorAll('.filter-bar a');
    const cardsProdutos = document.querySelectorAll('.produtos .card');
    const buscaInput = document.getElementById('busca-produto');

    let categoriaAtiva = 'todos';
    let termoBusca = '';

    const aplicarFiltros = () => {
        cardsProdutos.forEach(card => {
            const categoriaCard = card.getAttribute('data-categoria');
            const nomeCard = card.querySelector('h2, h3')?.innerText.toLowerCase() || "";
            
            const matchesCategoria = categoriaAtiva === 'todos' || categoriaCard === categoriaAtiva;
            const matchesBusca = nomeCard.includes(termoBusca);

            if (matchesCategoria && matchesBusca) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    };

    botoesFiltro.forEach(botao => {
        botao.addEventListener('click', (e) => {
            e.preventDefault();
            categoriaAtiva = botao.getAttribute('data-filter');

            // Atualiza a aparência dos botões (qual está ativo)
            botoesFiltro.forEach(b => b.classList.remove('active'));
            botao.classList.add('active');
            botao.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

            aplicarFiltros();
        });
    });

    if (buscaInput) {
        buscaInput.addEventListener('input', (e) => {
            termoBusca = e.target.value.toLowerCase();
            aplicarFiltros();
        });
    }

    // --- 7.5 PAUSAR ANIMAÇÃO DO CARROSSEL NO HOVER ---
    const slidesContainer = document.querySelector('.slides');
    if (slidesContainer) {
        slidesContainer.addEventListener('mouseenter', () => {
            slidesContainer.style.animationPlayState = 'paused';
        });
        slidesContainer.addEventListener('mouseleave', () => {
            slidesContainer.style.animationPlayState = 'running';
        });
    }

    // --- 8. LÓGICA DO FORMULÁRIO DE CONTATO (BACKEND INTEGRATION) ---
    const formContato = document.getElementById('form-contato');
    const contatoStatus = document.getElementById('contato-status');

    if (formContato) {
        formContato.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede o recarregamento da página
            
            const btn = formContato.querySelector('.btn-enviar');
            const formData = new FormData(formContato);
            
            // Feedback visual de carregamento
            btn.disabled = true;
            const textoOriginal = btn.innerText;
            btn.innerText = 'Enviando...';
            
            if (contatoStatus) {
                contatoStatus.style.display = 'block';
                contatoStatus.style.color = '#6db3f8';
                contatoStatus.innerText = 'Processando sua mensagem...';
            }

            try {
                // Envio real para o serviço de backend
                const response = await fetch(formContato.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    contatoStatus.style.color = '#493f64';
                    contatoStatus.innerText = '✓ Mensagem enviada com sucesso! Entraremos em contato em breve.';
                    formContato.reset();
                } else {
                    throw new Error('Falha no servidor');
                }
            } catch (error) {
                contatoStatus.style.color = '#ff6b6b';
                contatoStatus.innerText = 'Ops! Ocorreu um erro ao enviar. Tente novamente mais tarde.';
            } finally {
                btn.disabled = false;
                btn.innerText = textoOriginal;
            }
        });
    }

    // --- 9. ANIMAÇÕES DE REVELAÇÃO NA HOME ---
    const observerOptions = {
        threshold: 0.1 // Ativa quando 10% do item aparece
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visivel');
            }
        });
    }, observerOptions);

    // Seleciona elementos para animar (Cards e Títulos)
    const elementosParaAnimar = document.querySelectorAll('.product-card, .featured-section h2, .hero-content');
    elementosParaAnimar.forEach(el => {
        el.classList.add('revelar');
        observer.observe(el);
    });

    // --- 10. LÓGICA DE REDIRECIONAMENTO (PARA detalhes.html) ---
    // Em dispositivos móveis e desktop, abrir uma nova página melhora a navegação.
    const cards = document.querySelectorAll('.card, .product-card');
    
    const irParaDetalhes = (card) => {
        const id = card.id;
        if (id) {
            // Redireciona para a página de detalhes passando o ID do produto
            window.location.href = `detalhes.html?id=${id}`;
        }
    };

    cards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => irParaDetalhes(card));
    });

    // --- 11. BUSCADOR DINÂMICO DE DADOS (PARA detalhes.html) ---
    window.carregarDadosProduto = async (id) => {
        let cardSource = document.getElementById(id);

        // Se não estiver na página atual, busca os dados no arquivo produtos.html
        if (!cardSource) {
            try {
                const response = await fetch('produtos.html');
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Tenta achar pelo ID físico no HTML
                cardSource = doc.getElementById(id);

                // Se não achar (IDs gerados por JS), procura percorrendo os cards do arquivo
                if (!cardSource) {
                    const todosCards = doc.querySelectorAll('.card, .product-card');
                    cardSource = Array.from(todosCards).find(c => {
                        const t = c.querySelector('h2, h3')?.innerText || "";
                        const m = t.match(/ref\.?\s*(\d+)/i);
                        const generatedId = m ? `ref${m[1]}`.toLowerCase() : "";
                        return generatedId === id;
                    });
                }
            } catch (e) { console.error("Erro ao carregar banco de dados", e); }
        }

        if (!cardSource) {
            const loadMsg = document.getElementById('loading');
            if (loadMsg) loadMsg.innerText = "Produto não encontrado.";
            return;
        }

        const imgPrimaria = cardSource.querySelector('.primary-img')?.src || cardSource.querySelector('img')?.src;
        const imgSecundaria = cardSource.querySelector('.secondary-img')?.src;
        const titulo = cardSource.querySelector('h2, h3')?.innerText;
        const categoria = cardSource.querySelector('.categoria-tag')?.innerText;
        const descricao = cardSource.querySelector('p:not(.estoque):not(.preco)')?.innerText || "";
        const preco = cardSource.querySelector('.preco')?.innerText;
        const linkML = cardSource.querySelector('button')?.getAttribute('data-link');

        // Tenta encontrar a informação de Cor na descrição (ex: "Cor: Rosa")
        const corMatch = descricao.match(/Cor:\s*([^\n\r]+)/i);
        const corParaExibir = corMatch ? corMatch[1].trim() : titulo;

        // Preenche os campos da página detalhes.html
        const fotoCont = document.getElementById('foto-principal');
        if (fotoCont) fotoCont.innerHTML = `<div class="img-container"><img src="${imgPrimaria}" class="modal-img primary-img" id="main-modal-img"></div>`;
        
        const galeCont = document.getElementById('galeria-fotos');
        if (galeCont && imgSecundaria) {
            galeCont.innerHTML = `
                <button class="thumb-btn active" onclick="document.getElementById('main-modal-img').src='${imgPrimaria}'">Foto 1</button>
                <button class="thumb-btn" onclick="document.getElementById('main-modal-img').src='${imgSecundaria}'">Foto 2</button>
            `;
        }

        const infoCont = document.getElementById('info-produto');
        if (infoCont) {
            infoCont.innerHTML = `
                <span class="categoria-tag">${categoria}</span>
                <h2>${titulo}</h2>
                <p style="white-space: pre-line; color: #666;">${descricao}</p>
                <p class="preco" style="font-size: 2.5rem; color: #2e5e8f;">${preco}</p>
                <div class="aviso-variacao">
                    <strong>Atenção:</strong> Este link possui várias variações. Ao abrir o site, selecione a <strong>cor</strong> correspondente: <strong>${corParaExibir}</strong>.
                </div>
                <button onclick="window.open('${linkML}', '_blank')" class="btn-finalizar" style="max-width: 400px;">Comprar Agora</button>
            `;
        }

        document.getElementById('loading').style.display = 'none';
        document.getElementById('conteudo-produto').style.display = 'block';
    };

    // --- 12. LÓGICA DA LUPA (RE-IMPLEMENTADA PARA SER GLOBAL) ---
    const atualizarPosicaoLupa = (e) => {
        const isTouch = e.type.startsWith('touch');
        const clientX = isTouch ? (e.touches[0]?.clientX || e.changedTouches[0]?.clientX) : e.clientX;
        const clientY = isTouch ? (e.touches[0]?.clientY || e.changedTouches[0]?.clientY) : e.clientY;
        let container = e.target.closest('.img-container');
        if (container) {
            const rect = container.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            container.style.setProperty('--mouse-x', `${x}px`);
            container.style.setProperty('--mouse-y', `${y}px`);
            const img = container.querySelector('img');
            if (img) img.style.transformOrigin = `${(x/rect.width)*100}% ${(y/rect.height)*100}%`;
            if (isTouch) {
                if (e.type === 'touchstart' || e.type === 'touchmove') container.classList.add('lupa-ativa');
                else if (e.type === 'touchend') container.classList.remove('lupa-ativa');
            }
        }
    };

    document.addEventListener('mousemove', atualizarPosicaoLupa);
    document.addEventListener('touchstart', atualizarPosicaoLupa, { passive: true });
    document.addEventListener('touchmove', atualizarPosicaoLupa, { passive: true });
    document.addEventListener('touchend', atualizarPosicaoLupa, { passive: true });

    // --- 13. REDIRECIONAMENTO DE LINKS DIRETOS ---
    const verificarLinkDireto = () => {
        const hash = window.location.hash.substring(1).toLowerCase();
        if (hash && !window.location.pathname.includes('detalhes.html')) {
            window.location.href = `detalhes.html?id=${hash}`;
        }
    };

    // Monitora tanto o carregamento quanto a mudança de hash (links na mesma página)
    window.addEventListener('load', verificarLinkDireto);
    window.addEventListener('hashchange', verificarLinkDireto);
});