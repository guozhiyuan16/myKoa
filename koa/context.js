let context = {

}

function defineGetter(target,property){
    context.__defineGetter__(property,function(){
        return this[target][property];
    })
}

function defineSetter(target,property){
    context.__defineSetter__(property,function(value){
        this[target][property] = value;
    })
}

defineGetter('request','url');
defineGetter('request','path');
defineGetter('request','query');

defineGetter('response','body');
defineSetter('response','body');

module.exports = context;