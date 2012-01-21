var AudioContext;
if (!webkitAudioContext) {
	(function() {
		var audioDevice;

		AudioContext = function() {
			audioDevice = audioLib.AudioDevice(audioCallback, 2);
		}

		function audioCallback(buffer, channelCount) {
			for (var s = 0 ; s < samplers.length ; s++) {
				var sampler = samplers[s];
				if (sampler) {
					sampler.append(buffer, channelCount);
				}
			}
		}
	})();
} else {
	AudioContext = webkitAudioContext;
}
