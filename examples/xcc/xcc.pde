int fontsize = 11;

int view_size_h = 400;
int view_size_v = 600;
int view_off_h = 20;
int view_off_v = 20;
int node_size = 20;

void setup() {
  stroke(0);
  fill(0);
  textFont(createFont("Arial",fontsize));
  noLoop();
  rebuild();
}

void draw() {
  int i, r;
  background(256);

  size(view_size_h * view_scale, view_size_v * view_scale);

  pushMatrix();
  scale(view_scale);
  translate(view_off_h, view_off_v);

  if (showMatchlines) {
    noFill();
    stroke(128);
    drawMatches();
  }

  fill(255);
  stroke(0);
  drawEdges(nodes_a);
  drawNodes(nodes_a);
  drawEdges(nodes_b);
  drawNodes(nodes_b);

  stroke(0);
  drawMatchedNodes();

  fill(#FF0000);
  drawChangedNodes(removes);
  fill(#00FF00);
  drawChangedNodes(inserts);
  fill(#FFFF00);
  drawChangedNodes(updates);

  fill(0);
  drawLabels(nodes_a);
  drawLabels(nodes_b);

  popMatrix();
}

void drawMatches() {
  for (int i = 0; i < matches.length; i++) {
    if (!matches[i].display) {
      continue;
    }

    switch (matches[i].pass) {
      case 0:
        stroke(128);
        break;
      case 1:
        stroke(#9999CC);
        break;
      case 2:
        stroke(#99CCCC);
        break;
    }
    
    curve(
        matches[i].a.x - 20, matches[i].a.y - 200,
        matches[i].a.x, matches[i].a.y,
        matches[i].b.x, matches[i].b.y,
        matches[i].b.x + 20, matches[i].b.y - 200
        );
  }
}

void drawMatchedNodes() {
  for (int i = 0; i < matches.length; i++) {
    if (!matches[i].display) {
      continue;
    }

    switch (matches[i].pass) {
      case 0:
        fill(#CCCCCC);
        break;
      case 1:
        fill(#CCCCFF);
        break;
      case 2:
        fill(#CCFFFF);
        break;
    }
    
    drawNodes([matches[i].a, matches[i].b]);
  }
}


void drawChangedNodes(operations) {
  for (int i = 0; i < operations.length; i++) {
    if (!operations[i].display) {
      continue;
    }

    drawNodes(operations[i].nodes);
  }
}

void drawEdges(nodes) {
  for (int i = 0; i < nodes.length; i++) {
    if (nodes[i].par) {
      line(nodes[i].par.x, nodes[i].par.y, nodes[i].x, nodes[i].y);
    }
  }
}

void drawNodes(nodes) {
  ellipseMode(CENTER);
  for (int i = 0; i < nodes.length; i++) {
    ellipse(nodes[i].x, nodes[i].y, node_size, node_size);
  }
}

void drawLabels(nodes) {
  textAlign(CENTER);
  for (int i = 0; i < nodes.length; i++) {
    if (nodes[i].value) {
      text(nodes[i].value, nodes[i].x, nodes[i].y + 4);
    }
  }
}
