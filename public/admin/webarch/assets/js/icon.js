$(document).ready(function() {				
	    $('#icon-resize-slider').slider().on('slide', function(ev){
			var value=$('#icon-resize-slider').val();
			$('#icon-resize').removeClass("icon-2x icon-3x icon-4x icon-large icon-5x icon-6x icon-7x");
			switch (value)
				{
				case "1":
					//$('#icon-resize').addClass("icon-2x icon-3x icon-4x icon-large icon-5x icon-6x icon-7x");
				  break;
				case "2":
					
					$('#icon-resize').addClass("icon-2x");
				  break;
				case "3":
					$('#icon-resize').addClass("icon-3x");
				  break;
				case "4":
				  $('#icon-resize').addClass("icon-4x");
				  break;
				case "5":
				  $('#icon-resize').addClass("icon-5x");
				  break;
				case "6":
				  $('#icon-resize').addClass("icon-6x");
				  break;
				case "7":
				  $('#icon-resize').addClass("icon-7x");
				  break;
				} 
			//icon-resize
	   });
	    $('#icon-rotate-slider').slider().on('slide', function(ev){
			var value=$('#icon-rotate-slider').val();
			$('#icon-rotate').removeClass("icon-rotate-90 icon-rotate-180 icon-rotate-270");
			switch (value)
				{
				case "90":
					$('#icon-rotate').addClass("icon-rotate-90");
				  break;
				case "180":				
					$('#icon-rotate').addClass("icon-rotate-180");
				  break;
				case "270":
					$('#icon-rotate').addClass("icon-rotate-270");
				  break;
				} 
			//icon-rotate
	   });
	    $('#btn-animate-icon').click(function (e) {
			$('#animate-icon').toggleClass('icon-spin');
			e.preventDefault();
		});
      $('#myTab a').click(function (e) {
		e.preventDefault();
		$(this).tab('show');
		calculateHeight()
	  });
	});