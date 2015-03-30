$(document).ready(function () {

    $('#container').booking({
        url: 'json/data.json'
    });

});

(function ($, b, undefined) {
    b.booking = {
        options: {
            url: undefined,
            params: [],
            currency: '',
            money_symbol: '',
            data: {}
        }
    };

    var order = {
        table_room: 'default',
        reviews: 'default'
    };

    $.fn.booking = function (options) {
        options = options || {};
        var o = $.extend(true, {}, b.booking.options, options);
        return this.each(function () {
            this.booking = new Booking(this, o);
        });
    };

    function Booking(e, o) {

        var bk = this;

        bk.element = e;
        bk.options = o;
        bk.offset = 0;
        bk.gallery = '#gallery';

        bk.data = {};

        bk.defaults = {
            page:       '<nav class="feed_pagination"><a class="prev" href="javascript:;"></a><a class="next" href="javascript:;"></a></nav>' +
                        '<header class="header"><h1 class="hotel_name"><span class="title"></span><span class="name"></span> <span class="stars"></span></h1><address class="hotel_address"></address></header>' +
                        '<section class="photos"><ul class="photos_list"></ul></section>' +
                        '<section class="description"><h2>Description</h2></section>' +
                        '<section class="facilities"><h2>Facilities</h2><ul class="facilities_list"></ul></section>' +
                        '<section class="rooms"><h2>Select Your Room</h2><form method="post" action="" class="rooms_table_form">' +
                        '<table class="rooms_table" cellspacing="0" cellpadding="0"><thead><tr><th class="room_name">Room Name</th><th class="room_occupancy">Occupancy</th><th class="room_price">Price per Room</th><th class="room_quantity">No. Rooms</th></tr></thead><tbody></tbody><tfoot><tr><td></td><td class="total_room_occupancy"></td><td class="total_room_price"></td><td class="total_room_quantity"></td></tr><tr><td colspan="4"><button class="button" type="submit">Book Now</button></td></tr></tfoot></table></form></section>' +
                        '<section class="reviews"><h2>Reviews</h2><ul class="reviews_list"></ul></section>',

            gallery:    '<div id="gallery">' +
                        '<div class="slides"></div>' +
                        '<a class="prev" href="javascript:;">&#10094;</a><a class="next" href="javascript:;">&#10095;</a>' +
                        '</div>'
        };

        bk.init = function () {
            if(bk.options.url !== "undefined") {
                $.ajax({
                    url: bk.options.url,
                    dataType: 'json',
                    success: function(response) {
                        bk.data = response.data;
                        bk.options.currency = bk.options.currency || response.currency;
                        bk.options.money_symbol = bk.options.money_symbol || response.money_symbol;
                        bk.run(bk.offset);
                    }
                });
            }
        };

        bk.reset = function () {
            $(bk.element).html(bk.defaults.page).fadeIn();
        };

        bk.run = function (offset) {
            bk.offset = offset;

            bk.reset();

            bk._setNavigation();
            bk._setTitle(bk.data[offset].name);
            bk._setName(bk.data[offset].name);
            bk._setStars(bk.data[offset].stars);
            bk._setAddress(bk.data[offset].address);
            bk._setPhotos(bk.data[offset].photos);
            bk._setDescription(bk.data[offset].description);
            bk._setFacilities(bk.data[offset].facilities);
            bk._setRooms(bk.data[offset].rooms);
            bk._setReviews(bk.data[offset].reviews);
        };

        bk.navigate = function (offset) {
            console.log(offset);
            bk.run(offset);
        };

        bk.prevOffset = function () {
            offset = bk.offset - 1;
            if(offset < 0) offset = bk.data.length - 1;
            return offset;
        };

        bk.nextOffset = function () {
            offset = bk.offset + 1;
            if(offset >= bk.data.length) offset = 0;
            return offset;
        };

        bk._setNavigation = function (title) {
            $(bk.element).find('.feed_pagination .prev').click(function () {
                bk.navigate(bk.prevOffset());
            }).html('&#8592; ' + bk.data[bk.prevOffset()].name);
            $(bk.element).find('.feed_pagination .next').click(function () {
                bk.navigate(bk.nextOffset());
            }).html(bk.data[bk.nextOffset()].name + ' &#8594;');
        };

        bk._setTitle = function (title) {
            document.title = title + ' - Booking.com';
        };

        bk._setName = function (name) {
            $(bk.element).find('.hotel_name .title').html(name);
        };

        bk._setStars = function (stars) {
            var s = '';
            for (var i = 0; i < stars; i++) s += '\u2605';

            $(bk.element).find('.hotel_name .stars').html(s);
        };

        bk._setAddress = function (address) {
            $(bk.element).find('.hotel_address').html(address);
        };

        bk._setPhotos = function (photos) {
            var list = $('.photos_list');
            for (var i = 0; i < photos.length; i++) list.append('<li><a data-index="' + i + '" href="' + photos[i].image + '"><img src="' + photos[i].thumbnail + '" alt="' + photos[i].description + '" title="' + photos[i].description + '"></a></li>');

            bk._createGallery();

            list.find('a').click(function(e) {
                bk._preventDefault(e);
                bk._openGallery($(this).data('index'));
            });
        };

        bk._setDescription = function (description) {
            var p = description.split("\n"), block = $('.description');

            for (var i = 0; i < p.length; i++) block.append('<p>' + p[i] + '</p>');
        };

        bk._setFacilities = function (facilities) {
            var list = $('.facilities_list');
            for (var i = 0; i < facilities.length; i++) list.append('<li>' + facilities[i] + '</li>');
        };

        bk._setRooms = function (rooms) {
            var tbody = $(bk.element).find('.rooms_table tbody');

            for (var i = 0; i < rooms.length; i++) {
                var s = '<td class="room_name">' + rooms[i].name + '</td>';
                    s += '<td class="room_occupancy">' + rooms[i].occupancy + '</td>';
                    s += '<td class="room_price">' + bk.options.money_symbol + rooms[i].price_per_room + '</td>';
                    s += '<td class="room_quantity">' + bk._setAvailability(rooms[i]) + '</td>';

                tbody.append('<tr>' + s + '</tr>');
            }
        };

        bk._setReviews = function (reviews) {
            var list = $(bk.element).find('.reviews_list'), page = 5;

            if (reviews.length < 5) page = reviews.length;

            for (var i = 0; i <= page - 1; i++) {
                var s = '<strong class="review_score">' + reviews[i].score + '</strong>';
                    s += '<blockquote class="review_content">';
                    s += reviews[i].comment;
                    s += '<cite>' + reviews[i].user + '</cite>';
                    s += '</blockquote>';

                list.append('<li>' + s + '</li>');
            }
        };

        bk._setAvailability = function (rooms) {
            var select = '';

            for (var i = 0; i <= rooms.availability; i++) select += '<option value="' + i + '"' + (i == 0 ? ' selected="selected"' : '') + '>' + i + '</option>';

            return '<select name="room[' + rooms.value + ']" data-value="' + rooms.price_per_room + '">' + select + '</select>';
        };

        bk._createGallery = function () {
            if($(bk.gallery).length)
            {
                $(bk.gallery).remove();
            }
            $(bk.element).after(bk.defaults.gallery);
            $(bk.gallery).keyup(function(e){
                if (e.keyCode == 27) bk._closeGallery();
            });

            $(bk.gallery).find('.prev').click(function () {
                bk._prevSlide();
            });

            $(bk.gallery).find('.next').click(function () {
                bk._nextSlide();
            });

            $(bk.gallery).click(function(){
                //bk._closeGallery();
            });
        };

        bk._openGallery = function (index) {
            $(document.body).height($(window).height()).css('overflow', 'hidden');
            $(bk.gallery).find('.slides').css('backgroundImage', 'url(' + bk.data[bk.offset].photos[index].image + ')');
            $(bk.gallery).show().animate({opacity: 1}, 400);
            bk._createListeners();
        };

        bk._closeGallery = function () {
            bk._destroyListeners();
            $(bk.gallery).fadeOut();
            $(document.body).height('auto').css('overflow', 'auto');
        };

        bk._prevSlide = function () {
        };

        bk._nextSlide = function () {
            $(bk.element).find('.slides').animate({'left': (0 - ($(this).width))});
        };

        bk._createListeners = function () {
            $(document.body).on('keydown', function(event) {
                switch (event.which || event.keyCode) {
                    case 27: // Esc
                        bk._closeGallery();
                        break;
                    case 32: // Space
                        break;
                    case 37: // Left
                        break;
                    case 39: // Right
                        break;
                }
            });
        };

        bk._destroyListeners = function () {
            $(document.body).off('keydown');
        };

        bk._preventDefault = function (event) {
            if (event.preventDefault) {
                event.preventDefault();
            } else {
                event.returnValue = false;
            }
        };

        bk._stopPropagation = function (event) {
            if (event.stopPropagation) {
                event.stopPropagation();
            } else {
                event.cancelBubble = true;
            }
        };

        bk.init();
        return bk;
    };
})(jQuery, window);