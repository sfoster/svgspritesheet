function makeSpriteSheet(animationData, options) {
  console.log('makeSpriteSheet with: ', animationData, options);
  var outputSize = options.outputSize;
  var cropMargins = options.cropMargins || {};

  var width = animationData.w;
  var height = animationData.h;

  var croppedWidth = width - (cropMargins.left || 0) - (cropMargins.right || 0);
  var croppedHeight = height - (cropMargins.top || 0) - (cropMargins.bottom || 0);
  var scaleX = outputSize.width / croppedWidth;
  var scaleY = outputSize.height / croppedHeight;
  var uncroppedOutputSize = {
    width: width * scaleX,
    height: height * scaleY
  };
  var outputCropOffset = {
    x: cropMargins.left ? -(cropMargins.left || 0) * scaleX : 0,
    y: cropMargins.top ? -(cropMargins.top || 0) * scaleY : 0,
  };
  console.log('croppedWidth: %s, croppedHeight: %s', croppedWidth, croppedHeight);
  console.log('scaleX: %s, scaleY: %s', scaleX, scaleY);
  console.log('uncroppedOutputSize: %o, outputCropOffset: %o', uncroppedOutputSize, outputCropOffset);

  // var wrapper = document.createElement('div');
  var wrapper = document.getElementById('wrapper');
  while(wrapper.firstElementChild) {
    wrapper.removeChild(wrapper.firstElementChild);
  }
  var anim = bodymovin.loadAnimation({
    wrapper: wrapper,
    animType: 'svg',
    loop: true,
    autoplay: false,
    prerender: false,
    animationData: animationData,
  });

  var frameCount = anim.totalFrames;
  console.log('frameCount: ', anim.totalFrames);
  var frameRate = anim.frameRate;

  function adjustHashURL(value, prefix) {
    if (value.startsWith('url(#')) {
      var hash = value.substring('url(#'.length, value.length - 1);
      return 'url(#' + prefix + hash + ')';
    }
    return value;
  }

  function makeUnique(node, prefix) {
    if (node.id) {
      node.id = prefix + node.id;
    }
    for (const attribute of ['filter', 'mask', 'clip-path', 'fill', 'stroke']) {
      const value = node.getAttribute(attribute);
      if (value) {
        node.setAttribute(attribute, adjustHashURL(value, prefix));
      }
    }
    for (var i = 0; i < node.childNodes.length; i++) {
      makeUnique(node.childNodes[i], prefix);
    }
  }

  var doc = document.implementation.createDocument("", "", null);
  var output = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  output.setAttribute('width', frameCount * outputSize.width);
  output.setAttribute('height', outputSize.height);
  doc.appendChild(output);

  for (var i = 0; i <= frameCount; i++) {
    anim.goToAndStop(i, true);
    var svgNode = wrapper.firstElementChild.cloneNode(true);
    makeUnique(svgNode, 'f' + i + '_');
    svgNode.setAttribute('x', i * outputSize.width + outputCropOffset.x);
    svgNode.setAttribute('y', outputCropOffset.y);
    svgNode.setAttribute('width', uncroppedOutputSize.width);
    svgNode.setAttribute('height', uncroppedOutputSize.height);
    output.appendChild(svgNode);
  }
  wrapper.style.display = 'none';

  var serializer = new XMLSerializer();
  var str = serializer.serializeToString(doc);

  return {
    spriteSheet: {
      width: frameCount * outputSize.width,
      height: outputSize.height,
      str: str,
      dataURL: 'data:image/svg+xml;base64,' + btoa(str)
    },
    animationKeyframes: {
      transform: [ 'translateX(0px)', 'translateX(' + -((frameCount - 1) * outputSize.width) + 'px)']
    },
    animationOptions: {
      duration: frameCount / frameRate * 1000,
      easing: 'steps(' + (frameCount - 1) + ')',
      fill: 'forwards',
    }
  }
}
