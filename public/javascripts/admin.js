window.addEventListener('load', function () {
  const socket = io.connect('http://localhost:3001')

  var currentTime;  // Current time after press start
  var state=0;      // Job state: 0 = not run, 1 = run
  var instructions; // List of something to run
  var sequence;

  // DEMO variable
  var a=true;
  // DEMO variable

  function lockGUI()
  {
    console.log('Lock GUI')
    document.getElementById("idManoirDepart").classList.add('disabled');
    document.getElementById("idManoirRetour").classList.add('disabled');
    document.getElementById("idApoDepart").classList.add('disabled');
    document.getElementById("idApoRetour").classList.add('disabled');
  }

  function unlockGUI()
  {
    console.log('Unlock GUI')
    document.getElementById("idManoirDepart").classList.remove('disabled');
    document.getElementById("idManoirRetour").classList.remove('disabled');
    document.getElementById("idApoDepart").classList.remove('disabled');
    document.getElementById("idApoRetour").classList.remove('disabled');
  }

  function restoreGPIO()
  {
    console.log('Restore GPIO ')
  }

  function doJob()
  {
    if( state == 1 )
    {
      console.log('Next JSON instruction or sleep ?');
      var d = new Date();
      var now = d.getMilliseconds();

      console.log('Time is: ', now - d);

      if(a)
      {
        socket.emit('video start', { src: '/video/apoDepart.mp4' })
        a = false;
      }

      setTimeout(genericStop, 6000);
    }
  }

  function genericLauncher(idStory)
  {
    console.log("Launcher: ", idStory);

    if(state == 1)
    {
      genericStop();
    }
    else
    {
      // Read JSON

      // Disable GUI
      lockGUI();

      // Start sequence
      var d = new Date();
      currentTime = d.getMilliseconds();
      state = 1;

      sequence = setInterval(doJob, 200);
    }
  }

  function genericStop()
  {
    a = true;

    // Remove timer
    clearInterval(sequence);

    // Restore clean system state
    state = 0;
    socket.emit('video stop', {})
    unlockGUI();
    restoreGPIO();
  }

  socket.on('countdown_start', function (data) {
    console.log('countdown_start ', data)
    // socket.emit('my other event', { my: 'data' })
  })

  const countdownstart = document.getElementById('idStartCountdown')
  countdownstart.onclick = function () {
    console.log('click start !')
    socket.emit('countdown start', { ok: true })
  }
  const countdownstop = document.getElementById('idStopCountdown')
  countdownstop.onclick = function () {
    console.log('click stop !')
    socket.emit('countdown stop', { ok: true })
  }

  const videoStart = document.getElementById('idStartVideo')
  videoStart.onclick = function () {
    console.log('video start !')
    socket.emit('video start', { src: '/video/short-apocalypse.mp4' })
  }
  const videoStop = document.getElementById('idStopVideo')
  videoStop.onclick = function () {
    console.log('video stop !')
    socket.emit('video stop', {})
  }

  const manoirStart = document.getElementById('idManoirDepart')
  manoirStart.onclick = function () {
    genericLauncher('ManoirDepart')
  }


})