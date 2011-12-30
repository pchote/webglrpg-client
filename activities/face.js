// This file is part of webglrpg-client, Copyright (C) 2011 Paul Chote
// You can redistribute and/or modify it under the terms of version 3 of the
// GNU General Public License, as published by the Free Software Foundation.
// See LICENSE.html for the license terms.

def = {
    init: function(facing) {
        this.facing = facing;
    },

    tick: function(time) {
        this.actor.facing = this.facing;
        this.actor.setFrame(0);
        return true;
    }
};