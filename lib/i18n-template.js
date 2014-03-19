if ('undefined' === typeof hatch) var hatch = {};
hatch.__i18n = {};
hatch.__locale = 'en';

/**
 * Translate term
 *
 * @param {String} path - term to translate, e.g. "common.error.NotFound".
 * @param {Array} substitute - strings to insert into result instead of "%".
 * @param {String} defaultValue - this value will be used when translation missing.
 */
function t(path, substitute, defaultValue) {
    var translation = hatch.__i18n[hatch.__locale];

    if (arguments.length === 2) {
        if ('object' === typeof substitute || !path.match(/%/)) {
            defaultValue = substitute;
            substitute = null;
        }
    }

    function nextPathItem(token) {
        return (translation = translation[token]);
    }

    if (!translation || !path.split('.').every(nextPathItem)) {
        translation = defaultValue || 'translation missing for ' + hatch.__locale + '.' + path;
    }

    if (translation && substitute && substitute.length) {
        substitute.forEach(function(substitution) {
            translation = translation.replace(/%/, substitution.toString().replace(/%/g, ''));
        });
    }

    return translation;
}

$(function() {
    var locale = $('html').attr('lang');
    if (locale) {
        hatch.__locale = locale;
    }
});

hatch.__i18n = {{ i18n }};
