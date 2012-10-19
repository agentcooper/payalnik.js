var obj = {
	prop: 'le prop',

	defer: function() {
		setInterval(function() {
			console.log(this.prop); // should be 'that'
		}, 42);
	}
};

obj.defer();

var index = 0;
window.setInterval(function() {
	
	// will pollute global scope, should prevent
	this['_' + index] = index;

}, 100);