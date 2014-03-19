// Color Scheme
// Get information what colors are used on a html page.
var colorScheme = new function ()
{
   $(document).ready(function ()
   {
      that.analyse();
   });

   // Stores the colors
   this.colors = [];

   var that = this;

   // Analys the <body> element to detect all used colors. 
   this.analyse = function ()
   {
      that.colors = [];

      var body = $("body");
      getAllColorsRecursive(body);

   };

   // Create the color palette.
   // @param containerId {String} 
   //    ID of the DOM element that is used as a container for the color palette.
   //    (e.g.: <div id="colorPalette"></div>)
   this.create = function (containerId)
   {
      var container = $("#" + containerId);

      for (var color in that.colors)
      {
         // Ignore transparent colors. 
         if (color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)')
         {
            $('<span class="colorItemColor" style="background-color:' + color + ';"></span>').appendTo(item);
            $('<span class="colorItemText">' + rgbToHashStyle(color) + '</span>').appendTo(item);
            var item = $('<div class="colorItem"></div').appendTo(container);
         }
      }
   };

   // Convert a rgb color value to a hash-hex color value. rgb(0,0,0) => #000000
   // @param rgbColorString {String}
   //    A color given as rgb string in the format rgb([0-255],[0-255],[0-255])
   // @return {String}
   //    Returns a hash-hex color value if possible. Otherwise the original parameter.
   function rgbToHashStyle(rgbColorString)
   {
      var hexString = rgbColorString;

      var regexp = /rgb\(([0-9]+), ([0-9]+), ([0-9]+)\)/;

      if (regexp.test(rgbColorString))
      {
         var result = regexp.exec(rgbColorString);

         hexString = "#" + Converter.byteToHex(result[1]) + Converter.byteToHex(result[2]) + Converter.byteToHex(result[3]);
      }

      return hexString;
   }

   // Recursive function that analyses all child elements for colors.
   // @param jqObj {object jQuery}
   //    A jQuery object that represents the parent object.
   function getAllColorsRecursive(jqObj)
   {
      addColorFromCss(jqObj, "backgroundColor");
      addColorFromCss(jqObj, "color");
      addColorFromCss(jqObj, "borderColor");

      // Analyse all children.
      jqObj.children().each(function ()
      {
         getAllColorsRecursive($(this));
      });
   }


   // Add a color from a css property to the color store.
   // @param jqObj {object jQuery}
   //    A jQuery object that represents the parent object.
   function addColorFromCss(jqObj, cssProperty)
   {
      var color = jqObj.css(cssProperty);
      var hexColor = rgbToHashStyle(color);

      that.colors[hexColor] = hexColor;
   }


} ();


// A simple Converter that converts a byte to hex number.
var Converter = 
{
   hexDigits: '0123456789ABCDEF',

   byteToHex: function (byteNumber)
   {
      return (this.hexDigits[byteNumber >> 4] + this.hexDigits[byteNumber & 15]);
   }
}