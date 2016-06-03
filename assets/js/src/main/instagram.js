/*
$(document).ready(function () {

  var clientId = "6433a7290419437ea0da55357c4561b6";
  
  $(".instagram-section").each(function(){
    var $section = $(this);

    var user_ids = [];
    var hashtags = [];
    var photos = [];
    var promises = [];

    if($section.attr('data-user-ids')){
      user_ids = $section.attr('data-user-ids').split(" ");
    }
    if($section.attr('data-hashtags')){
      hashtags = $section.attr('data-hashtags').split(" ");
    }

    $.each(user_ids, function(){
      var id = this;
      promises.push(
        $.ajax({
          url: 'https://api.instagram.com/v1/users/'+id+'/media/recent/?client_id='+clientId+'&count=20',
          dataType: 'jsonp',
          success: function(response){
              photos = photos.concat(response.data);
          }
        })
      );
    });

    $.each(hashtags, function(){
      var hashtag = this;
      promises.push(
        $.ajax({
          url: 'https://api.instagram.com/v1/tags/'+hashtag+'/media/recent/?client_id='+clientId+'&count=20',
          dataType: 'jsonp',
          success: function(response){
              photos = photos.concat(response.data);
          }
        })
      );
    });

  
    $.when.apply($, promises).done(function ( v1, v2 ) {
  
        photos = photos.sort(function(a,b){ return b.created_time - a.created_time; });
  
        var result = [];
        $.each(photos, function(index, item) {
            var flag = false;
            $.each(result, function(index2, item2) {
                if (item.id == item2.id) {
                   flag = true;
                }
            });
            if(!flag) {
                result.push(item);
            }
        });
  
        result = result.slice(0,10);
  
        $section.html('');
        $.each(result, function(i, photo) {
            if(!photo.caption) { photo.caption = {text: ""}; }
            var style = "background-image:url('" + photo.images.standard_resolution.url +"')";
            $section.append('<a target="_blank" href="'+photo.link+'" class="photo" style="'+style+'"></a>');
        });
  
    });
  
  });

});
*/

