
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', function (e) {
      e.preventDefault(); 

      navItems.forEach(i => i.classList.remove('active'));
      this.classList.add('active');

      console.log('Nav item clicked:', this.dataset.name);
    });
  });

