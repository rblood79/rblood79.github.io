
window.addEventListener('DOMContentLoaded', event => {
    const submit = document.querySelector('.submit');
    const sections = document.querySelectorAll('.scroll');
    const nav = document.querySelector('nav');
    const navList = document.querySelectorAll('.nav-item');

    const navbar = document.querySelector('.navbar-nav');
    const navbarToggler = document.querySelector('.navbar-toggler');

    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#mainNav .nav-link')
    );

    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).visibility !== 'hidden') {
                navbarToggler.click();
            }
        });
    });

    navbarToggler.addEventListener('click', () => {
        if (window.getComputedStyle(navbarToggler).visibility !== 'hidden') {
            navbar.classList.toggle('active');
        }
    });

    const options = {
        root: null,
        threshold: 0.5,
    }

    const callback = (entries, observer) => {
        navbar.classList.remove('active');
        entries.forEach((e) => {
            if (e.isIntersecting) {
                e.target.classList.add('active');
                e.target.id !== 'home' ? nav.classList.add('active') : nav.classList.remove('active');
                //
                navList.forEach(link => {
                    e.target.id === link.dataset.nav ? link.classList.add('active') : link.classList.remove('active')
                });
            } else {
                e.target.classList.remove('active');
            }
        });
    }

    const observer = new IntersectionObserver(callback, options);
    sections.forEach(section => observer.observe(section));

    //문의사항 보내기
    submit.addEventListener('click', (e)=> {
        e.preventDefault;
        alert('폼 전송~ 어디로~~');
    })
});
