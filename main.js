"use strict";
require('constants'),
require('globals'),

require('creep');
//require('spawns');

module.exports.loop = function(){
    Object.assign(global, Memory.constants.actions, Memory.constants.tasks);
    var taskGivers = [];
    for(var id in Game.spawns) Game.spawns[id].run();
    for(var name in Game.creeps) Game.creeps[name].run();

    for(var roomName in Game.rooms) {
        var room = Game.rooms[roomName];
        if(!room.memory.sources) room.memory.sources = room.find(FIND_SOURCES);
        for(let sourceid in room.memory.sources) taskGivers.push(room.memory.sources[sourceid]);
    }

    for(let giverid in taskGivers){
        let giver = taskGivers[giverid];
        console.log(getAccessibleTiles(giver.pos.x-1, giver.pos.y-1,
                                       giver.pos.x+1, giver.pos.y+1));
    }

}

function findKey(obj, value) {
    for( var prop in obj ) {
        if( obj.hasOwnProperty(prop) ) {
             if( obj[prop] === value )
                 return prop;
        }
    }
}

function getAccessibleTile(room, x1, y1, x2, y2){
    var accessibleTiles = 0.0;
    for (var x = x1, xl = x2+1; x < xl; x++){
        for (var y = y1, yl = y2+1; y < yl; y++){
            //console.log(JSON.stringify(room.lookAt(x, y)));
            var tile = room.lookAt(x, y);
            for (var propertyid in tile) {
                if (tile[propertyid].type == "creep" || tile[propertyid].type == "source"){
                    break;
                } else if (tile[propertyid].terrain == 'plain') {
                    return tile[propertyid];
                } else if (tile[propertyid].terrain == 'swamp') {
                    return tile[propertyid];
                }
            }

        }
    }
    return false;
}
// Find how many tiles around a structure is accessible
function findAccessibleTiles(room, x1, y1, x2, y2){
    var tiles = { available: 0.0, total:0 };
    for (var x = x1, xl = x2+1; x < xl; x++){
        for (var y = y1, yl = y2+1; y < yl; y++){
            //console.log(JSON.stringify(room.lookAt(x, y)));
            var tile = room.lookAt(x, y);
            for (var propertyid in tile) {
                if(tile[propertyid].type == "source"){
                    break;
                } else if (tile[propertyid].type == "creep"){
                    tiles.available--; tiles.total++;
                } else if (tile[propertyid].terrain == 'plain') {
                    tiles.available++; tiles.total++;
                } else if (tile[propertyid].terrain == 'swamp') {
                    tiles.available++; tiles.total++;
                    //tiles.available += 0.5; tiles.total++;
                }
            }

        }
    }
    return tiles;
}
