let pageManager = null;
let selectedCategory = "";
let currentKeywords = [];
let showFullText = false;
let searchPanelVisible = true;
let waitingHandle = null;
const waitingGifTrigger = 800;

Init_UI();

async function Init_UI() {
    pageManager = new PageManager('scrollPanel', 'itemsPanel', 'sample', renderPosts);

    $('#createPost').on('click', () => { renderCreatePostForm(); });
    $('#abort').on('click', () => { showPosts(); });
    $('#collapseText').on('click', () => toggleGlobalText(false));
    $('#expandText').on('click', () => toggleGlobalText(true));
    $('#searchPosts').on('click', () => applyKeywordFilter());
    $('#clearSearch').on('click', () => clearKeywordFilter());
    $('#toggleSearchPanel').on('click', () => toggleSearchPanel());
    $('#searchKeys').on('keypress', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            applyKeywordFilter();
        }
    });

    applySearchPanelVisibility();
    showPosts();
    await pageManager.update();
    applyHighlights($('#itemsPanel'));
    Posts_API.start_Periodic_Refresh(async () => {
        if ($('#scrollPanel').is(':visible')) {
            await pageManager.update();
            applyHighlights($('#itemsPanel'));
        }
    });
}

function addWaitingGif() {
    clearTimeout(waitingHandle);
    waitingHandle = setTimeout(() => {
        if ($('#waitingGif').length === 0) {
            $('#itemsPanel').append($("<div id='waitingGif' class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>"));
        }
    }, waitingGifTrigger);
}

function removeWaitingGif() {
    clearTimeout(waitingHandle);
    $('#waitingGif').remove();
}

function showPosts() {
    $('#actionTitle').text('Fil de nouvelles');
    $('#scrollPanel').show();
    $('#forms').hide();
    clearForms();
    $('#aboutContainer').hide();
    deleteError();
    $('#createPost').show();
    $('#categoriesMenu').show();
    $('#abort').hide();
    applySearchPanelVisibility();
    Posts_API.resume_Periodic_Refresh();
}

function hidePosts() {
    $('#scrollPanel').hide();
    $('#createPost').hide();
    $('#categoriesMenu').hide();
    $('#abort').show();
    $('#forms').show().css('display', 'flex');
    Posts_API.stop_Periodic_Refresh();
}

function renderAbout() {
    hidePosts();
    $('#actionTitle').text('A propos');
    $('#aboutContainer').show();
    $('#postForm').hide();
    $('#errorContainer').hide();
}

function renderError(message) {
    hidePosts();
    $('#actionTitle').text('Erreur du serveur');
    $('#postForm').hide();
    $('#aboutContainer').hide();
    $('#errorContainer').show();
    $('#errorContainer').html(`<div>${HighlightUtils.escapeHtml(message)}</div>`);
}

function deleteError() {
    $('#errorContainer').hide().empty();
}

function clearForms() {
    $('#postForm').empty().hide();
}

function toggleGlobalText(expand) {
    showFullText = expand;
    $('.bookmarkText').each(function () {
        $(this).toggleClass('showExtra', expand).toggleClass('hideExtra', !expand);
    });
    $('.toggleTextCmd').each(function () {
        updateToggleIcon($(this), expand);
    });
}

function togglePostText($card, forceExpand = null) {
    const $text = $card.find('.bookmarkText');
    const expand = forceExpand !== null ? forceExpand : !$text.hasClass('showExtra');
    $text.toggleClass('showExtra', expand).toggleClass('hideExtra', !expand);
    const $icon = $card.find('.toggleTextCmd');
    updateToggleIcon($icon, expand);
}

function updateToggleIcon($icon, expanded) {
    if (!$icon || $icon.length === 0) return;
    $icon.removeClass('fa-angles-down fa-angles-up');
    $icon.addClass(expanded ? 'fa-angles-up' : 'fa-angles-down');
    $icon.attr('title', expanded ? 'Reduire' : 'Afficher plus');
}

function updateSearchToggleIcon() {
    const $icon = $('#toggleSearchPanel');
    $icon.removeClass('fa-magnifying-glass fa-magnifying-glass-minus');
    $icon.addClass(searchPanelVisible ? 'fa-magnifying-glass-minus' : 'fa-magnifying-glass');
    $icon.attr('title', searchPanelVisible ? 'Masquer la recherche' : 'Afficher la recherche');
}

function applySearchPanelVisibility(animated = false) {
    const $panel = $('#filterPanel');
    if (animated) {
        $panel.stop(true, true);
        if (searchPanelVisible) {
            $panel.slideDown(200, () => $panel.css('display', 'flex'));
        } else {
            $panel.slideUp(200);
        }
    } else {
        $panel.stop(true, true);
        if (searchPanelVisible) {
            $panel.show().css('display', 'flex');
        } else {
            $panel.hide();
        }
    }
    updateSearchToggleIcon();
}

function toggleSearchPanel() {
    searchPanelVisible = !searchPanelVisible;
    applySearchPanelVisibility(true);
}

function applyKeywordFilter() {
    currentKeywords = HighlightUtils.normalizeTokens($('#searchKeys').val());
    pageManager.reset();
}

function clearKeywordFilter() {
    $('#searchKeys').val('');
    currentKeywords = [];
    pageManager.reset();
}

function applyHighlights(container = null) {
    const $targets = container ? $(container).find('.keywordTarget') : $('.keywordTarget');
    if (currentKeywords.length === 0) {
        HighlightUtils.clear($targets);
    } else {
        HighlightUtils.apply($targets, currentKeywords);
    }
}

async function compileCategories() {
    const response = await Posts_API.Get('?select=Category&sort=Category');
    if (response !== null && !Posts_API.error) {
        const items = response.data ?? [];
        const categories = [];
        items.forEach(item => {
            if (item.Category && !categories.includes(item.Category)) {
                categories.push(item.Category);
            }
        });
        updateCategoriesMenu(categories);
    }
}

function updateCategoriesMenu(categories) {
    const menu = $('#DDMenu');
    menu.empty();
    let selectClass = selectedCategory === '' ? 'fa-check' : 'fa-fw';
    menu.append($(`
        <div class="dropdown-item menuItemLayout" id="allCatCmd">
            <i class="menuIcon fa ${selectClass} mx-2"></i> Toutes les categories
        </div>
    `));
    menu.append($('<div class="dropdown-divider"></div>'));
    categories.forEach(category => {
        selectClass = selectedCategory === category ? 'fa-check' : 'fa-fw';
        menu.append($(`
            <div class="dropdown-item menuItemLayout categoryCmd">
                <i class="menuIcon fa ${selectClass} mx-2"></i> ${HighlightUtils.escapeHtml(category)}
            </div>
        `));
    });
    menu.append($('<div class="dropdown-divider"></div>'));
    menu.append($(`
        <div class="dropdown-item menuItemLayout" id="aboutCmd">
            <i class="menuIcon fa fa-info-circle mx-2"></i> A propos
        </div>
    `));

    $('#aboutCmd').off('click').on('click', () => renderAbout());
    $('#allCatCmd').off('click').on('click', () => {
        selectedCategory = '';
        pageManager.reset();
    });
    $('.categoryCmd').off('click').on('click', function () {
        selectedCategory = $(this).text().trim();
        pageManager.reset();
    });
}

async function renderPosts(container, queryString) {
    deleteError();
    let endOfData = false;
    let finalQuery = queryString.startsWith('?') ? queryString : `?${queryString}`;
    const extraParams = ['sort=-Creation'];
    if (selectedCategory !== '') extraParams.push(`Category=${encodeURIComponent(selectedCategory)}`);
    if (currentKeywords.length > 0) extraParams.push(`keywords=${currentKeywords.join(',')}`);
    if (extraParams.length > 0) {
        finalQuery += `${finalQuery.includes('?') ? '&' : '?'}${extraParams.join('&')}`;
    }
    addWaitingGif();
    await compileCategories();
    const response = await Posts_API.Get(finalQuery);
    removeWaitingGif();
    if (response === null || Posts_API.error) {
        renderError(Posts_API.currentHttpError || 'Une erreur est survenue');
        return true;
    }
    const posts = response.data ?? [];
    if (posts.length === 0) {
        endOfData = true;
    } else {
        posts.forEach(post => {
            container.append(renderPost(post));
        });
        bindPostEvents();
        applyHighlights(container);
    }
    return endOfData;
}

function renderPost(post) {
    const localDate = DateUtils.convertToFrenchDate(DateUtils.UTC_To_Local(post.Creation));
    const escapeHtml = HighlightUtils.escapeHtml;
    const $row = $(`
        <div class="BookmarkRow" id="post-${post.Id}">
            <div class="BookmarkContainer noselect">
                <div class="BookmarkLayout">
                    <div class="Bookmark">
                        <div class="postThumb"></div>
                        <div class="bookmarkInfo">
                            <span class="bookmarkTitle keywordTarget"></span>
                            <span class="bookmarkDate">${escapeHtml(localDate)}</span>
                            <p class="bookmarkText keywordTarget ${showFullText ? 'showExtra' : 'hideExtra'}"></p>
                        </div>
                    </div>
                    <span class="BookmarkCategory keywordTarget"></span>
                </div>
                <div class="BookmarkCommandPanel">
                    <span class="editCmd cmdIcon fa fa-pencil" editPostId="${post.Id}" title="Modifier"></span>
                    <span class="deleteCmd cmdIcon fa fa-trash" deletePostId="${post.Id}" title="Retirer"></span>
                </div>
                <span class="toggleTextCmd cmdIcon fa fa-angles-down" togglePostId="${post.Id}" title="Afficher plus"></span>
            </div>
        </div>
    `);

    const thumb = $row.find('.postThumb');
    if (post.Image) {
        thumb.css('background-image', `url('${post.Image}')`);
    } else {
        thumb.css('background-color', '#d6d6d6');
    }

    const $category = $row.find('.BookmarkCategory');
    $category.data('raw', post.Category ?? '');
    $category.html(escapeHtml(post.Category ?? ''));

    const $title = $row.find('.bookmarkTitle');
    $title.data('raw', post.Title ?? '');
    $title.html(escapeHtml(post.Title ?? ''));

    const $text = $row.find('.bookmarkText');
    const rawText = post.Text ?? '';
    $text.data('raw', rawText);
    $text.html(escapeHtml(rawText).replace(/\n/g, '<br>'));

    updateToggleIcon($row.find('.toggleTextCmd'), showFullText);
    return $row;
}

function bindPostEvents() {
    $('.editCmd').off('click').on('click', async function () {
        const id = $(this).attr('editPostId');
        await renderEditPostForm(id);
    });
    $('.deleteCmd').off('click').on('click', async function () {
        const id = $(this).attr('deletePostId');
        await renderDeletePostForm(id);
    });
    $('.toggleTextCmd').off('click').on('click', function () {
        const $container = $(this).closest('.BookmarkContainer');
        togglePostText($container);
    });
}

function newPost() {
    return {
        Id: '',
        Title: '',
        Text: '',
        Category: '',
        Image: '',
        Creation: ''
    };
}

function renderCreatePostForm() {
    renderPostForm();
}

async function renderEditPostForm(id) {
    deleteError();
    addWaitingGif();
    const response = await Posts_API.Get(`/${id}`);
    removeWaitingGif();
    if (response === null || Posts_API.error) {
        renderError(Posts_API.currentHttpError || 'Post introuvable');
        return;
    }
    const post = response.data;
    if (!post) {
        renderError('Post introuvable');
        return;
    }
    renderPostForm(post);
}

function renderPostForm(post = null) {
    hidePosts();
    deleteError();
    $('#aboutContainer').hide();
    $('#postForm').show().empty();
    const create = post === null;
    if (create) post = newPost();
    $('#actionTitle').text(create ? 'Creation' : 'Modification');
    const escapeHtml = HighlightUtils.escapeHtml;
    $('#postForm').append(`
        <form class="form" id="PostForm">
            <input type="hidden" name="Id" value="${post.Id}" />
            <input type="hidden" name="Creation" value="${post.Creation ?? ''}" />

            <label for="Title" class="form-label">Titre</label>
            <input 
                class="form-control"
                name="Title" 
                id="Title" 
                placeholder="Titre"
                required
                RequireMessage="Veuillez saisir un titre"
                value="${escapeHtml(post.Title ?? '')}"
            />

            <label for="Category" class="form-label">Categorie</label>
            <input 
                class="form-control"
                name="Category"
                id="Category"
                placeholder="Categorie"
                required
                RequireMessage="Veuillez saisir une categorie"
                value="${escapeHtml(post.Category ?? '')}"
            />

            <label for="Text" class="form-label">Texte</label>
            <textarea 
                class="form-control"
                name="Text"
                id="Text"
                placeholder="Texte"
                rows="5"
                required
                RequireMessage="Veuillez saisir un texte">${escapeHtml(post.Text ?? '')}</textarea>

            <label class="form-label">Image</label>
            <div class="imageUploader" 
                newImage="${create}"
                controlId="Image"
                imageSrc="${post.Image ?? ''}"
                waitingImage="Loading_icon.gif">
            </div>
            <hr>
            <input type="submit" value="Enregistrer" id="savePost" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
    initImageUploaders();
    if (typeof initFormValidation === 'function') {
        initFormValidation();
    }

    $('#PostForm').on('submit', async function (event) {
        event.preventDefault();
        const postData = getFormData($('#PostForm'));
        addWaitingGif();
        const result = await Posts_API.Save(postData, create);
        removeWaitingGif();
        if (result !== null && !Posts_API.error) {
            showPosts();
            await pageManager.reset();
            applyHighlights($('#itemsPanel'));
        } else {
            renderError(Posts_API.currentHttpError || 'Une erreur est survenue');
        }
    });
    $('#cancel').on('click', () => {
        showPosts();
    });
}

async function renderDeletePostForm(id) {
    deleteError();
    addWaitingGif();
    const response = await Posts_API.Get(`/${id}`);
    removeWaitingGif();
    if (response === null || Posts_API.error) {
        renderError(Posts_API.currentHttpError || 'Post introuvable');
        return;
    }
    const post = response.data;
    if (!post) {
        renderError('Post introuvable');
        return;
    }
    hidePosts();
    $('#actionTitle').text('Retrait');
    $('#errorContainer').hide();
    $('#aboutContainer').hide();
    $('#postForm').show().empty();
    const escapeHtml = HighlightUtils.escapeHtml;
    const previewText = (post.Text ?? '').trim();
    const truncated = previewText.length > 160 ? `${previewText.slice(0, 160)}...` : previewText;
    $('#postForm').append(`
        <div class="postdeleteForm">
            <h4>Effacer le post suivant?</h4>
            <div class="PostPreview">
                <div class="PostPreviewImage" style="background-image:url('${post.Image ?? ''}')"></div>
                <div>
                    <strong>${escapeHtml(post.Title ?? '')}</strong>
                    <p>${escapeHtml(truncated)}</p>
                </div>
            </div>
            <div>
                <input type="button" value="Effacer" id="deletePost" class="btn btn-danger">
                <input type="button" value="Annuler" id="cancelDelete" class="btn btn-secondary">
            </div>
        </div>
    `);
    $('#deletePost').on('click', async () => {
        addWaitingGif();
        const result = await Posts_API.Delete(id);
        removeWaitingGif();
        if (result) {
            showPosts();
            await pageManager.reset();
            applyHighlights($('#itemsPanel'));
        } else {
            renderError(Posts_API.currentHttpError || 'Une erreur est survenue');
        }
    });
    $('#cancelDelete').on('click', () => {
        showPosts();
    });
}

function getFormData($form) {
    const removeTag = new RegExp('(<[a-zA-Z0-9/]+>)', 'g');
    const jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, '');
    });
    return jsonObject;
}
