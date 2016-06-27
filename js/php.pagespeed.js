var w = 500;
var h = 420;
var wTemp = $(window).width() - 100;
var hTemp = $(window).height() - 150;
if (wTemp <= w || hTemp <= h) {} else if (wTemp > hTemp) {
  h = hTemp;
  w = hTemp + 50;
} else {
  w = wTemp;
  h = wTemp - 50;
}
var r = w / 2 - 100,
  maxLine = 2 * r,
  minLine = 10,
  colorIndex = 0,
  colors = ['#ff6666', '#66ccff', '#ffcc66'],
  nodes = [],
  links = [],
  loose = [],
  maxTweetLength, minTweetLength;
var logoTextWidth = w / 8;
var logoTextTop = h / 2 - logoTextWidth / 3;
var logoTextLeft = w / 2 - logoTextWidth / 2;
var vis = d3.select("#OKfestContainer").append("svg:svg").attr("width", w).attr("height", h);
var force = d3.layout.force().nodes(nodes).links(links).gravity(0.7).linkDistance(function(link, index) {
  return linkLength(link.target.text.length);
}).linkStrength(function(link, index) {
  return 0.1;
}).charge(function(d) {
  if (d.type == "tag") return 0;
  if (d.type == 'linked') return -150000 * r * r / (d3.select('#LogoVizNodes').selectAll("span")[0].length * 450 * 450);
}).size([w, h]);
var looseForce = d3.layout.force().nodes(loose).gravity(0.8).charge(-50).size([w, h]);
force.on("tick", tick);
looseForce.on("tick", loosetick)

function tick() {
  vis.selectAll("line.link").attr("x1", function(d) {
    return d.source.x;
  }).attr("y1", function(d) {
    return d.source.y;
  }).attr("x2", function(d) {
    return d.target.x;
  }).attr("y2", function(d) {
    return d.target.y;
  });
  vis.selectAll("circle").attr('cx', function(d) {
    return d.x
  }).attr('cy', function(d) {
    return d.y
  })
}

function loosetick() {
  vis.selectAll("circle.loose").attr('cx', function(d) {
    return d.x
  }).attr('cy', function(d) {
    return d.y
  })
}

function nextInLine() {
  var color = colors[colorIndex];
  colorIndex++;
  if (colorIndex >= colors.length) colorIndex = 0;
  return color;
}

function linkLength(length) {
  return ((maxLine - minLine) / (maxTweetLength - minTweetLength)) * (length - maxTweetLength) + maxLine;
}

function findItemIndex(id, array) {
  for (key in array) {
    if (array[key].id == id) return key;
  }
  return false;
}

function formatTweet(tweet) {
  return '<p><strong>' + tweet.user + ':</strong> ' + tweet.text + '</p>';
}

function getRelatedTweets(tag) {
  var relatedTweets = [];
  vis.selectAll("line.link").each(function(d) {
    if (d.source.id == tag.id) {
      relatedTweets.push(d.target);
    };
  });
  var text = "<h1>" + tag.text + "</h1>";
  for (key in relatedTweets) text += "<div>" + formatTweet(relatedTweets[key]) + "</div>";
  return text;
}

function calculateX(currentX, length, angle) {
  return currentX + Math.cos(angle) * length;
}

function calculateY(currentY, length, angle) {
  return currentY + Math.sin(angle) * length;
}

function updateData(starting) {
  d3.json("js/interface.json", function(json) {
    minTweetLength = json.minLength;
    maxTweetLength = json.maxLength;
    var ownLoose = d3.select('#loose').selectAll("span").data(json.loose, function(d) {
      return d.id
    });
    ownLoose.enter().append("span").each(function(d) {
      loose.push(d);
    });
    ownLoose.exit().each(function(d) {
      var key = findItemIndex(d.id, loose);
      if (key) {
        loose.splice(key, 1)
      }
    }).remove();
    var loosenode = vis.selectAll("circle.loose").data(loose, function(d) {
      return d.id;
    });
    loosenode.enter().append("svg:circle").attr("cx", function(d) {
      return d.x
    }).attr("cy", function(d) {
      return d.y
    }).attr("class", "loose").attr("r", 2).on('click', function(d) {
      alert("hoi");
    });;
    loosenode.exit().remove()
    looseForce.start();
    var ownNodes = d3.select('#LogoVizNodes').selectAll("span").data(json.nodes, function(d) {
      return d.id
    });
    ownNodes.enter().append("span").each(function(d) {
      nodes.push(d);
    });
    ownNodes.each(function(d) {
      if (d.type == "tag") {
        var key = findItemIndex(d.id, nodes);
        if (key) {
          nodes[key].x = calculateX(w / 2, r, d.angle);
          nodes[key].y = calculateY(h / 2, r, d.angle);
        }
      }
    }).on('click', function(d) {
      alert("hoi");
    });
    ownNodes.exit().each(function(d) {
      var key = findItemIndex(d.id, nodes);
      if (key) {
        nodes.splice(key, 1)
      }
    }).remove();
    var ownLinks = d3.select('#LogoVizLinks').selectAll("span").data(json.links, function(d) {
      return d.id
    });
    ownLinks.enter().append("span").each(function(d) {
      links.push({
        "target": nodes[findItemIndex(d.targetid, nodes)],
        "source": nodes[findItemIndex(d.sourceid, nodes)],
        id: d.id
      });
    });
    ownLinks.exit().each(function(d) {
      var key = findItemIndex(d.id, links);
      if (key) {
        links.splice(key, 1)
      }
    }).remove();
    var node = vis.selectAll("circle.node").data(nodes, function(d) {
      return d.id;
    });
    node.enter().append("svg:circle").attr("cx", function(d) {
      if (d.type == "tag") return calculateX(w / 2, r, d.angle);
      return d.x
    }).attr("cy", function(d) {
      if (d.type == "tag") return calculateY(h / 2, r, d.angle);
      d.y
    }).attr("style", function(d) {
      if (d.type == "tag") return "fill:black;";
      if (d.type == "tag" || d.type == "linked") return "display:none;"
    }).attr("class", function(d) {
      if (d.type == "tag") return "node tag";
      return "node";
    }).attr("r", 0.5).each(function(d) {
      if (d.type == "tag") d.color = nextInLine();
    });
    node.exit().remove();
    var link = vis.selectAll("line.link").data(links, function(d) {
      return d.id
    });
    link.enter().insert("svg:line").attr("class", "link").attr("x1", function(d) {
      return d.source.x;
    }).attr("y1", function(d) {
      return d.source.y;
    }).attr("x2", function(d) {
      return d.target.x;
    }).attr("y2", function(d) {
      return d.target.y;
    }).attr("style", function(d) {
      if (typeof d.source == "object") return "stroke:" + d.source.color;
      return "stroke:" + nodes[d.source].color;
    });
    link.exit().remove();
    vis.selectAll("circle.tag").transition().each(function(d) {
      d.cx = d.x;
      d.px = d.x;
      d.cy = d.y;
      d.py = d.y;
    });
    var text = vis.selectAll("text.text").data(json.texts, function(d) {
      return d.id
    });
    text.enter().append("text").attr("x", function(d) {
      return calculateX(w / 2, r, d.angle) + (Math.abs(Math.cos(d.angle)) < 0.2 ? -d.text.length * 4 : Math.cos(d.angle) > 0 ? 2 : -d.text.length * 8);
    }).attr("y", function(d) {
      return calculateY(h / 2, r, d.angle) + (Math.sin(d.angle) > 0 ? Math.sin(d.angle) * 15 : -2);
    }).attr("class", 'text').text(function(d) {
      return d.text;
    });
    vis.selectAll("line.link").on('click', function(d) {
      d3.select('#text #textNode').html(formatTweet(d.target));
      d3.select('#text').style("display", "block");
      d3.select('#text').style("left", d3.event.pageX + "px").style("top", d3.event.pageY + 20 + "px");
    });
    d3.select('#closeTweet').on('click', function() {
      d3.select('#text').style("display", "none");
    })
    loosenode.on("click", function(d) {
      d3.select('#text').html(formatTweet(d));
    });
    text.on('click', function(d) {
      window.open('http://twitter.com/#!/search/' + escape("#okfest " + d.text))
    }).transition().attr("x", function(d) {
      return calculateX(w / 2, r, d.angle) + (Math.abs(Math.cos(d.angle)) < 0.2 ? -d.text.length * 4 : Math.cos(d.angle) > 0 ? 2 : -d.text.length * 8);
    }).attr("y", function(d) {
      return calculateY(h / 2, r, d.angle) + (Math.sin(d.angle) > 0 ? Math.sin(d.angle) * 15 : -2);
    });
    text.exit().remove();
    force.start();
  });
}
$(document).ready(function() {
  $('#logoText').width(logoTextWidth);
  $('#logoText').css({
    'top': logoTextTop,
    'left': logoTextLeft
  });
  $('#OKfestContainer').css({
    "display": "block",
    "fontFamily": "Gudea, Sans Serif",
    'width': r * 2 + 200,
    'height': h
  });
});
updateData(true);
