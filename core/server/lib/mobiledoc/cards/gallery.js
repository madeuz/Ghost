/**
 * <figure class="kg-gallery-card kg-width-wide">
 *   <div class="kg-gallery-container>
 *        <div class="kg-gallery-image"><img width="" height=""></div>
 *        <div class="kg-gallery-image"><img width="" height=""></div>
 *        <div class="kg-gallery-image"><img width="" height=""></div>
 *        <div class="kg-gallery-image"><img></div>
 *        <div class="kg-gallery-image"><img></div>
 *      </div>
 *   </div>
 *   <figcaption></figcaption>
 * </figure>
 */

const createCard = require('../create-card');

module.exports = createCard({
    name: 'gallery',
    type: 'dom',
    render(opts) {
        let payload = opts.payload;
        // let version = opts.options.version;
        let dom = opts.env.dom;

        let isValidImage = (image) => {
            return image.fileName
                && image.src
                && image.width
                && image.height;
        };

        let validImages = [];

        if (payload.images && payload.images.length) {
            validImages = payload.images.filter(isValidImage);
        }

        if (validImages.length === 0) {
            return '';
        }

        let figure = dom.createElement('figure');
        figure.setAttribute('class', 'kg-card kg-gallery-card kg-width-wide');

        let container = dom.createElement('div');
        container.setAttribute('class', 'kg-gallery-container');
        figure.appendChild(container);

        validImages.forEach((image) => {
            let imgDiv = dom.createElement('div');
            imgDiv.setAttribute('class', 'kg-gallery-image');

            let img = dom.createElement('img');
            img.setAttribute('src', image.src);
            img.setAttribute('width', image.width);
            img.setAttribute('height', image.height);

            if (image.alt) {
                img.setAttribute('alt', image.alt);
            }
            if (image.title) {
                img.setAttribute('title', image.title);
            }

            imgDiv.appendChild(img);
            container.appendChild(imgDiv);
        });

        if (payload.caption) {
            let figcaption = dom.createElement('figcaption');
            figcaption.appendChild(dom.createRawHTMLSection(payload.caption));
            figure.appendChild(figcaption);
            figure.setAttribute('class', `${figure.getAttribute('class')} kg-card-hascaption`);
        }

        return figure;
    },

    absoluteToRelative(urlUtils, payload, options) {
        if (payload.images) {
            payload.images.forEach((image) => {
                image.src = image.src && urlUtils.absoluteToRelative(image.src, options);
                image.caption = image.caption && urlUtils.htmlAbsoluteToRelative(image.caption, options);
            });
        }

        payload.caption = payload.caption && urlUtils.htmlAbsoluteToRelative(payload.caption, options);

        return payload;
    },

    relativeToAbsolute(urlUtils, payload, options) {
        if (payload.images) {
            payload.images.forEach((image) => {
                image.src = image.src && urlUtils.relativeToAbsolute(image.src, options);
                image.caption = image.caption && urlUtils.htmlRelativeToAbsolute(image.caption, options);
            });
        }

        payload.caption = payload.caption && urlUtils.htmlRelativeToAbsolute(payload.caption, options);

        return payload;
    }
});
