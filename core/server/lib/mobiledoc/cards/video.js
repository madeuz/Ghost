const createCard = require('../create-card');

module.exports = createCard({
    name: 'video',
    type: 'dom',
    render(opts) {
        let payload = opts.payload;
        // let version = opts.options.version;
        let dom = opts.env.dom;

        if (!payload.src) {
            return '';
        }

        let figure = dom.createElement('figure');
        let figureClass = 'kg-card kg-video-card';
        if (payload.cardWidth) {
            figureClass = `${figureClass} kg-width-${payload.cardWidth}`;
        }
        figure.setAttribute('class', figureClass);

        let video = dom.createElement('video');
        video.setAttribute('src', payload.src);
        video.setAttribute('poster', payload.poster);
        video.setAttribute('width', payload.width);
        video.setAttribute('height', payload.height);
        video.setAttribute('controls', 'controls');
        video.setAttribute('class', 'kg-video');
        
        figure.appendChild(video);

        if (payload.caption) {
            let figcaption = dom.createElement('figcaption');
            figcaption.appendChild(dom.createRawHTMLSection(payload.caption));
            figure.appendChild(figcaption);
            figure.setAttribute('class', `${figure.getAttribute('class')} kg-card-hascaption`);
        }

        return figure;
    },

    absoluteToRelative(urlUtils, payload, options) {
        payload.src = payload.src && urlUtils.absoluteToRelative(payload.src, options);
        payload.caption = payload.caption && urlUtils.htmlAbsoluteToRelative(payload.caption, options);
        return payload;
    },

    relativeToAbsolute(urlUtils, payload, options) {
        payload.src = payload.src && urlUtils.relativeToAbsolute(payload.src, options);
        payload.caption = payload.caption && urlUtils.htmlRelativeToAbsolute(payload.caption, options);
        return payload;
    }
});
