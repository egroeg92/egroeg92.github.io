//Written By George Macrae 
//Feb 2021

    
        const images = document.querySelectorAll('.anim');

        observer = new IntersectionObserver((entries) => {

            entries.forEach(entry => {
                if(entry.intersectionRatio > 0) {
                    entry.target.style.animation = `${entry.target.dataset.anim} ${entry.target.dataset.ease} ${entry.target.dataset.delay} forwards ease-out`;
                }
                else {
                    entry.target.style.animation = 'none';
                }
            })

        })

        images.forEach(image => {
            observer.observe(image)
        })


function checkScroll(){
    var startY = $('.navbar').height() * 2; //The point where the navbar changes in px
    if($(window).scrollTop() > startY){
        $('.navbar').addClass("scrolled");
        
        $('.topScroll').addClass("top-appear");


    }else{
        $('.navbar').removeClass("scrolled");
        
        $('.topScroll').removeClass("top-appear");

    }
}

if($('.navbar').length > 0){

    $(window).on("scroll load resize", function(){
        checkScroll();
    });
}
//let circle = document.getElementById('cursor');
//    const onMouseMove = (e) =>{
//      cursor.style.left = e.pageX + 'px';
//      cursor.style.top = e.pageY + 'px';
//    }
//document.addEventListener('mousemove', onMouseMove);

  /*--/ Star Typed /--*/
  if ($('.text-slider').length == 1) {
    var typed_strings = $('.text-slider-items').text();
    var typed = new Typed('.text-slider', {
      strings: typed_strings.split(','),
      typeSpeed: 80,
      loop: true,
      backDelay: 1100,
      backSpeed: 30
    });
  }

(jQuery);

