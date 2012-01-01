// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

var config = {
    activityRequestUrl : function(id) { return "activities/"+id+".js" },
    actorRequestUrl: function(id) { return 'actors/'+id+'.js'; },
    tilesetRequestUrl: function(id) { return "tilesets/"+id+".ts"; },
    zoneRequestUrl: function(id) { return "maps/"+id+".map"; },
};
