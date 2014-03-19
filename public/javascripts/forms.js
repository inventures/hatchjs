(function() {

    $(initForms);

    function initForms() {

        $('form[data-remote=true]').each(function() {
            var f = $(this);
            var action = f.attr('action');
            if (action && !action.split('?')[0].match(/\.json$/)) {
                f.attr('action', action + '.json');
            }
            f.attr('data-type', 'json');
        });

        $('body').on(
            'ajax:success', 'form[data-remote=true],a[data-remote=true]',
            function (ev, data) {
                handle(data, $(this));
            }
        );

    }

    function handle(res, $el) {

        $el.trigger('server:response', [res]);

        switch (res.code) {

            case 304:
            case 302:
            window.location = res.location;
            break;

            case 500:
            $el.trigger('server:error', [res.error, res]);
            break;

            case 200:
            $el.trigger('server:success', [res]);
            break;

        }
    }

})(this);
