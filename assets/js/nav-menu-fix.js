(function ($) {
  $(function () {
    $('.elementor-nav-menu').each(function () {
      var $menu = $(this);
      $menu.on('click', '.menu-item-has-children > a.elementor-item-anchor', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var $item = $(this).parent('li');
        var isOpen = $item.hasClass('elementor-active');
        $menu.find('li.elementor-active').removeClass('elementor-active');
        if (!isOpen) {
          $item.addClass('elementor-active');
        }
      });
    });
    $(document).on('click', function (e) {
      if (!$(e.target).closest('.elementor-nav-menu').length) {
        $('.elementor-nav-menu li.elementor-active').removeClass('elementor-active');
      }
    });
    $(document).on('keyup', function (e) {
      if (e.key === 'Escape') {
        $('.elementor-nav-menu li.elementor-active').removeClass('elementor-active');
      }
    });
  });
})(jQuery);