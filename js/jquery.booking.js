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
        bk.slide= 0;

        bk.timer;
        bk.isPlaying = false;
        bk.reviewsPerPage = 5;
        bk.reviewsPages = 1;
        bk.reviewsOffset = 0;

        bk.data = {};

        bk.order = {
            rooms: {
                asc: true,
                field: 'price_per_room'
            },
            reviews:  {
                asc: false,
                field: 'score',
                text: 'Highest score'
            }
        };

        bk.defaults = {
            page:       '<nav class="feed_pagination"><a class="prev" href="javascript:;"></a><a class="next" href="javascript:;"></a></nav>' +
                        '<header class="header"><h1 class="hotel_name"><span class="title"></span> <span class="stars"></span></h1><address class="hotel_address"></address></header>' +
                        '<section class="photos"><ul class="photos_list"></ul></section>' +
                        '<section class="description"><h2>Description</h2></section>' +
                        '<section class="facilities"><h2>Facilities</h2><ul class="facilities_list"></ul></section>' +
                        '<section class="rooms"><h2>Select Your Room</h2><form method="post" action="" class="rooms_table_form">' +
                        '<table class="rooms_table" cellspacing="0" cellpadding="0"><thead><tr><th class="room_name"><a class="sort" data-filter="name" href="javascript:;" title="Sort by Room Name">Room Name</a></th><th class="room_occupancy"><a class="sort" data-filter="occupancy" href="javascript:;" title="Sort by Occupancy">Occupancy</a></th><th class="room_price"><a class="sort" data-filter="price_per_room" href="javascript:;" title="Sort by Price per Room">Price per Room</a></th><th class="room_quantity">No. Rooms</th></tr></thead><tbody></tbody><tfoot><tr><td></td><td class="total_room_occupancy"></td><td class="total_room_price"></td><td class="total_room_quantity"></td></tr><tr><td colspan="4"><button class="button" type="submit">Book Now</button></td></tr></tfoot></table></form></section>' +
                        '<section class="reviews"><h2>Reviews<small>Sort by<div class="sorting"><a class="dropdown"></a><ul><li><a data-filter="highest_score" href="javascript:;">Highest score</a></li><li><a data-filter="lowest_score" href="javascript:;">Lowest score</a></li><li><a data-filter="most_recent" href="javascript:;">Most recent</a></li><li><a data-filter="most_older" href="javascript:;">Most older</a></li></ul></div></small></h2><ul class="reviews_list"></ul><div class="pagination"><a class="prev" href="javascript:;">&#8249; Previous</a><ul></ul><a class="next" href="javascript:;">Next &#8250;</a></div></section>',

            gallery:    '<div id="gallery">' +
                        '<div class="slide">' +
                        '<a class="close" href="javascript:;">Exit <b>&times;</b></a>' +
                        '<div class="label"><h1 class="hotel_name"><span class="title"></span> <span class="stars"></span></h1><div class="text"></div><div class="counter"></div><a class="slideshow" href="javascript:;">&#9658;</a></div>' +
                        '</div>' +
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

            bk._setRoomsColumns();
            bk._setReviewsFilters();
            bk._createReviewsPagination();
        };

        bk._setTitle = function (title) {
            document.title = title + ' - Booking.com';
        };

        bk._setName = function (name) {
            $(bk.element).find('.hotel_name .title').html(name);
        };

        bk._setStars = function (stars) {

            $(bk.element).find('.hotel_name .stars').html(bk._buildStars(stars));
        };

        bk._buildStars = function (stars) {
            var s = '';
            for (var i = 0; i < stars; i++) s += '\u2605';

            return s;
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
            var table = $(bk.element).find('.rooms_table');
            table.find('tbody').html('');
            table.find('thead a').removeClass('asc').removeClass('desc');
            table.find(".sort[data-filter='" + bk.order.rooms.field + "']").addClass((bk.order.rooms.asc ? 'asc' : 'desc'));

            var r = rooms.sort(bk._sortRooms[(bk.order.rooms.asc ? 'asc' : 'desc')][bk.order.rooms.field]);

            for (var i = 0; i < r.length; i++) {
                var s = '<td class="room_name">' + r[i].name + '</td>';
                    s += '<td class="room_occupancy">' + r[i].occupancy + '</td>';
                    s += '<td class="room_price">' + bk.options.money_symbol + r[i].price_per_room + '</td>';
                    s += '<td class="room_quantity">' + bk._setAvailability(r[i]) + '</td>';

                table.find('tbody').append('<tr>' + s + '</tr>');
            }
        };

        bk._setRoomsColumns = function () {
            $(bk.element).find('.rooms_table thead a').click(function() {
                bk._orderRooms(!bk.order.rooms.asc, $(this).data('filter'));
            });
        };

        bk._orderRooms = function (asc, field) {

            if(bk.order.rooms.field !== field) asc = true;

            bk.order.rooms = {
                asc: asc,
                field: field
            };

            bk._setRooms(bk.data[bk.offset].rooms);
        };

        bk._sortRooms = {
            asc: {
                name: function (a, b) {
                    return bk._sort(a, b, 'name', true);
                },
                occupancy:  function (a, b) {
                    return bk._sort(a, b, 'occupancy', true);
                },
                price_per_room: function (a, b) {
                    return bk._sort(a, b, 'price_per_room', true);
                }
            },
            desc: {
                name: function (a, b) {
                    return bk._sort(a, b, 'name', false);
                },
                occupancy:  function (a, b) {
                    return bk._sort(a, b, 'occupancy', false);
                },
                price_per_room: function (a, b) {
                    return bk._sort(a, b, 'price_per_room', false);
                }
            }
        };

        bk._setAvailability = function (rooms) {
            var select = '';

            for (var i = 0; i <= rooms.availability; i++) select += '<option value="' + i + '"' + (i == 0 ? ' selected="selected"' : '') + '>' + i + '</option>';

            return '<select name="room[' + rooms.value + ']" data-filter="' + rooms.price_per_room + '">' + select + '</select>';
        };

        bk._setReviews = function (reviews) {
            var list = $(bk.element).find('.reviews_list'), page = bk.reviewsPerPage;

            bk._handleReviewsPagination();

            $(bk.element).find('.sorting .dropdown').html(bk.order.reviews.text);

            var r = reviews.sort(bk._sortReviews[(bk.order.reviews.asc ? 'asc' : 'desc')][bk.order.reviews.field]);

            $(bk.element).find('.reviews_list').html('');

            for (var i = (bk.reviewsOffset * bk.reviewsPerPage); i <= (((bk.reviewsOffset + 1) * bk.reviewsPerPage) - 1); i++) {
                var s = '<strong class="review_score">' + r[i].score + '</strong>';
                    s += '<blockquote class="review_content">';
                    s += r[i].comment;
                    s += '<cite>' + r[i].user + '</cite>';
                    s += '</blockquote>';

                list.append('<li>' + s + '</li>');
            }
        };

        bk._createReviewsPagination = function () {

            var pagination = $(bk.element).find('.reviews .pagination');

            bk.reviewsPages = Math.round(bk.data[bk.offset].reviews.length / bk.reviewsPerPage);
            bk.reviewsOffset = 0;

            pagination.find('a.prev').click(function (){
                bk._prevPageReviews();
            });

            pagination.find('a.next').click(function (){
                bk._nextPageReviews();
            });

            for(var i = 0; i < bk.reviewsPages; i++) {
                pagination.find('ul').append('<li><a class="page" data-page="' + i + '" href="javascript:;">' + (i + 1) + '</a></li>');
            }

            pagination.find('li a').click(function (){
                bk._paginateReviews($(this).data('page'));
            });
        };

        bk._handleReviewsPagination = function () {
            var pagination = $(bk.element).find('.reviews .pagination');

            pagination.find('a.prev, a.next').removeClass('disabled');

            if(bk.reviewsOffset == 0) {
                pagination.find('a.prev').addClass('disabled');
            } else if(bk.reviewsOffset == (bk.reviewsPages - 1)) {
                pagination.find('a.next').addClass('disabled');
            }

            pagination.find('li a').removeClass('active');
            pagination.find("li a[data-page='" + bk.reviewsOffset + "']").addClass('active');
        };

        bk._paginateReviews = function (page) {
            bk.reviewsOffset = (page >= 0 && page < bk.reviewsPages ? page : 0);
            bk._setReviews(bk.data[bk.offset].reviews);
        };

        bk._prevPageReviews = function () {
            bk.reviewsOffset--;
            if(bk.reviewsOffset < 0) bk.reviewsOffset = 0;
            bk._setReviews(bk.data[bk.offset].reviews);
        };

        bk._nextPageReviews = function () {
            bk.reviewsOffset++;
            if(bk.reviewsOffset >= (bk.reviewsPages - 1)) bk.reviewsOffset = (bk.reviewsPages - 1);
            bk._setReviews(bk.data[bk.offset].reviews);
        };

        bk._setReviewsFilters = function () {
            $(bk.element).find('.sorting .dropdown').click(function(){
                $(this).parent().toggleClass('open');
            });

            $(bk.element).find('.sorting li a').click(function(index, value) {
                bk.reviewsOffset = 0;

                $(bk.element).find('.sorting').removeClass('open');
                bk._orderReviews($(this).data('filter'));
            });
        };

        bk._orderReviews = function (filter) {

            filters = {
                highest_score: {
                    asc: false,
                    field: 'score',
                    text: 'Highest score'
                },
                lowest_score: {
                    asc: true,
                    field: 'score',
                    text: 'Lowest score'
                },
                most_recent: {
                    asc: false,
                    field: 'date',
                    text: 'Most recent'
                },
                most_older: {
                    asc: true,
                    field: 'date',
                    text: 'Most older'
                }
            };

            bk.order.reviews = filters[filter];

            bk._setReviews(bk.data[bk.offset].reviews);
        };

        bk._sortReviews = {
            asc: {
                score: function (a, b) {
                    return bk._sort(a, b, 'score', true);
                },
                date: function (a, b) {
                    return bk._sort(a, b, 'date', true);
                }
            },
            desc: {
                score: function(a, b) {
                    return bk._sort(a, b, 'score', false);
                },
                date: function(a, b) {
                    return bk._sort(a, b, 'date', false);
                }
            }
        };

        bk._sort = function (a, b, field, ascending) {
            if(ascending) {
                if (a[field] < b[field]) return -1;
                if (a[field] > b[field]) return 1;
            } else {
                if (a[field] > b[field]) return -1;
                if (a[field] < b[field]) return 1;
            }
            return 0;
        };

        bk._createGallery = function () {
            if($(bk.gallery).length)
            {
                $(bk.gallery).remove();
            }
            $(bk.element).after(bk.defaults.gallery);

            $(bk.gallery).find('.close').click(function () {
                bk._closeGallery();
            });

            $(bk.gallery).find('.slideshow').click(function () {
                if(bk.isPlaying) {
                    bk._stopSlideshow();
                } else {
                    bk._startSlideshow();
                }
            });

            $(bk.gallery).find('.prev').click(function () {
                bk._prevSlide();
            });

            $(bk.gallery).find('.next').click(function () {
                bk._nextSlide();
            });
        };

        bk._openGallery = function (slide) {
            bk.slide = slide;

            bk._changeSlide();

            $(document.body).height($(window).height()).css('overflow', 'hidden');
            $(bk.gallery).show().animate({opacity: 1}, 400);

            bk._createListeners();
        };

        bk._closeGallery = function () {
            bk._destroyListeners();
            if(bk.isPlaying) {
                bk._stopSlideshow();
            }
            $(bk.gallery).fadeOut();
            $(document.body).height('auto').css('overflow', 'auto');
        };

        bk._prevSlide = function () {
            bk.slide--;
            if(bk.slide <= 0) bk.slide = (bk.data[bk.offset].photos.length - 1);
            if(bk.isPlaying) {
                bk._stopSlideshow();
            }
            bk._changeSlide();
        };

        bk._nextSlide = function () {
            bk.slide++;
            if(bk.slide > (bk.data[bk.offset].photos.length - 1)) bk.slide = 0;
            if(bk.isPlaying) {
                bk._stopSlideshow();
            }
            bk._changeSlide();
        };

        bk._changeSlide = function () {
            $(bk.gallery).find('.slide').css('backgroundImage', 'url(' + bk.data[bk.offset].photos[bk.slide].image + ')');
            $(bk.gallery).find('.slide .label .hotel_name .title').html(bk.data[bk.offset].name);
            $(bk.gallery).find('.slide .label .hotel_name .stars').html(bk._buildStars(bk.data[bk.offset].stars));
            $(bk.gallery).find('.slide .label .hotel_address').html(bk.data[bk.offset].address);
            $(bk.gallery).find('.slide .label .text').html(bk.data[bk.offset].photos[bk.slide].description);
            $(bk.gallery).find('.slide .label .counter').html('Showing photo ' + (bk.slide + 1) + ' of ' + bk.data[bk.offset].photos.length + '.');
        };

        bk._startSlideshow = function () {
            $(bk.gallery).find('.slideshow').html('&#10074;&#10074;');
            clearInterval(bk.timer);
            bk.timer = setInterval(bk._nextSlideshow, 3000);
            bk.isPlaying = true;
        };

        bk._stopSlideshow = function () {
            $(bk.gallery).find('.slideshow').html('&#9658;');
            clearInterval(bk.timer);
            bk.isPlaying = false;
        };

        bk._nextSlideshow = function () {
            bk.slide++;
            if(bk.slide > (bk.data[bk.offset].photos.length - 1)) bk.slide = 0;
            bk._changeSlide();
        };

        bk._createListeners = function () {
            $(document.body).on('keydown', function(event) {
                console.log(event.keyCode);
                switch(event.which || event.keyCode) {
                    case 8: // Backspace
                    case 37: // Left arrow
                    case 38: // Up arrow
                        bk._preventDefault(event);
                        bk._prevSlide();
                        break;
                    case 9: // Tab
                    case 13: // Enter
                    case 39: // Right arrow
                    case 40: // Down arrow
                        bk._preventDefault(event);
                        bk._nextSlide();
                        break;
                    case 32: // Space bar
                        bk._preventDefault(event);
                        if(bk.isPlaying) {
                            bk._stopSlideshow();
                        } else {
                            bk._startSlideshow();
                        }
                        break;
                    case 27: // Esc
                        bk._preventDefault(event);
                        bk._closeGallery();
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