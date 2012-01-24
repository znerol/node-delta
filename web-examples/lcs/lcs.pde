int fontsize = 11;

int grid_cell_v = 32;
int grid_off_v = 64;
int grid_label_off_v = -12;
int grid_cell_h = 32;
int grid_off_h = 64;
int grid_label_off_h = -20;

int grid_kline_off = 4;
int grid_dcontour_off = 4;

int view_size_h = 400;
int view_size_v = 600;

void setup() {
  stroke(0);
  fill(0);
  textFont(createFont("Arial",fontsize));
  noLoop();
  rebuild_dpath_segments();
}

void draw() {
  int i, r;
  background(256);

  size(view_size_h * view_scale, view_size_v * view_scale);

  pushMatrix();
  scale(view_scale);
  translate(grid_off_h, grid_off_v);

  fill(0);
  drawGridLabels(input_a, input_b);

  if (grid) {
    stroke(#EEEEEE);
    drawGrid(input_a.length, input_b.length);
  }

  if (show_editgraph) {
    fill(255);
    stroke(63);
    drawEditGraphEdges(input_a, input_b);
  }

  if (klines) {
    drawKLines(input_a.length, input_b.length); //, d);
  }

  for (r=0; r < recursions.length; r++) {
    if (r > 0) {
      if (recursions[r].display) {
        drawLimits(recursions[r]);
      }
    }
    if (dcontours) {
      fill(0);
      stroke(#66CC66);
      for (d = 0; d < recursions[r].dcontsfw.length; d++) {
        if (!recursions[r].dcontsfw[d]) {
          continue;
        }

        coords = [];
        for (i = 0; i < recursions[r].dcontsfw[d].length; i++) {
          if (!recursions[r].dcontsfw[d][i].display) {
            continue;
          }
          coords = append(coords, [recursions[r].dcontsfw[d][i].pos[0],
              recursions[r].dcontsfw[d][i].pos[1]]);
        }

        drawDContour(coords, d);
      }
      for (d = 0; d < recursions[r].dcontsbw.length; d++) {
        if (!recursions[r].dcontsbw[d]) {
          continue;
        }

        coords = [];
        for (i = 0; i < recursions[r].dcontsbw[d].length; i++) {
          if (!recursions[r].dcontsbw[d][i].display) {
            continue;
          }
          coords = append(coords, [recursions[r].dcontsbw[d][i].pos[0],
              recursions[r].dcontsbw[d][i].pos[1]]);
        }

        drawDContour(coords, d);
      }
    }

    // draw forward paths
    fill(#FFFFFF);
    stroke(#0000FF);
    for (i = 0; i < recursions[r].pathsfw.length; i = i+1) {
      if (!recursions[r].pathsfw[i].display) {
        continue;
      }
      drawDpathSegment(recursions[r].pathsfw[i].edges);
    }

    // draw backward paths
    fill(#FFFFFF);
    stroke(#FF0066);
    for (i = 0; i < recursions[r].pathsbw.length; i = i+1) {
      if (!recursions[r].pathsbw[i].display) {
        continue;
      }
      drawDpathSegment(recursions[r].pathsbw[i].edges);
    }

    // draw middle snake
    fill(#FFFFFF);
    stroke(31);
    if (recursions[r].middlesnake.display) {
      drawDpathSegment(recursions[r].middlesnake.edges);
    }
  }

  // draw lcs paths
  stroke(#00CC00);
  strokeWeight(1.2);
  for (i = 0; i < lcs_paths.length; i++) {
    if (!lcs_paths[i].display) {
      continue;
    }
    drawDpathSegment(lcs_paths[i].edges);
  }


  fill(#FFCCCC);
  stroke(#FF0000);
  strokeWeight(1);
  for (i = 0; i < lcs_positions.length; i++) {
    if (!lcs_positions[i].display) {
      continue;
    }
    drawLcsPosition(lcs_positions[i]);
  }

  popMatrix();
}

/**
 * Grid labels contained in strings A (horizontal) and B (vertical)
 */
void drawGridLabels(A, B) {
  for (i = 0; i <= A.length; i = i+1) {
    text(A[i], (i + 1) * grid_cell_h - 2, grid_label_off_v);
  }

  for (i = 0; i <= B.length; i = i+1) {
    text(B[i], grid_label_off_h, (i + 1) * grid_cell_v + 2);
  }
}

/**
 * Draw NxM background grid
 */
void drawGrid(N, M) {
  for (i = 0; i <= N; i = i+1) {
    line( i * grid_cell_h, 0, i * grid_cell_h, grid_cell_v * M);
  }

  for (i = 0; i <= M; i = i+1) {
    line( 0, i * grid_cell_v, grid_cell_h * N, i * grid_cell_v);
  }
}

/**
 * Draw all edges of the NxM edit graph
 */
void drawEditGraphEdges(A, B) {
  int N = A.length;
  int M = B.length;

  // first row
  pushMatrix();
  for (int i = 0; i < N; i++) {
    translate(grid_cell_h, 0);
    line(-grid_cell_h, 0, 0, 0);
    drawArrowHead(0, 0, -PI/2);
  }
  popMatrix();

  // first column
  pushMatrix();
  for (int k = 0; k < M; k++) {
    translate(0, grid_cell_v);
    line(0, -grid_cell_v, 0, 0);
    drawArrowHead(0, 0, 0);
  }
  popMatrix();

  // body
  pushMatrix();
  for (int i = 0; i < N; i++) {
    translate(grid_cell_h, 0);
    pushMatrix();
    for (int k = 0; k < M; k++) {
      translate(0, grid_cell_v);
      line(-grid_cell_h, 0, 0, 0);
      line(0, -grid_cell_v, 0, 0);
      drawArrowHead(0, 0);
      drawArrowHead(0, 0, -PI/2);
      if (A[i] === B[k]) {
        line(-grid_cell_h, -grid_cell_v, 0, 0);
        drawArrowHead(0, 0, -PI/4);
      }
    }
    popMatrix();
  }
  popMatrix();
}

/**
 * draw k-lines in NxM grid. Active k-lines, i.e. the lines respected during
 * the calculation of the current path are drawn stronger than inactive ones.
 */
void drawKLines(N, M /*, D*/) {
  for (i = -M; i <= N; i = i+1) {
//    int active = (i >= -D && i <= D &&
//        ((i % 2) == (D % 2) || (-i % 2) == (D % 2)));
//
//    if (active) {
//      stroke(#CC00CC);
//      fill(#000000);
//    }
//    else {
      stroke(#CC99CC);
      fill(#999999);
//    }

    line( (i < 0 ? 0 : i) * grid_cell_h - grid_kline_off,
          (i < 0 ? -i : 0) * grid_cell_v - grid_kline_off,
          (i < N - M ? M + i : N) * grid_cell_h + grid_kline_off,
          (i < N - M ? M : N - i) * grid_cell_v + grid_kline_off);
    pushMatrix();
    translate(
          (i < N - M ? M + i : N) * grid_cell_h + grid_kline_off,
          (i < N - M ? M : N - i) * grid_cell_v + grid_kline_off*2);
    rotate(PI/4);
    text('k = ' + i, 0, 0);
    popMatrix();
  }
}

/**
 * Draw one d-contour along the given array of x-y coordinates.
 */
void drawDContour(coords, d) {
  if (coords.length == 0) {
    return;
  }

  line (coords[0][0] * grid_cell_h - grid_dcontour_off,
        coords[0][1] * grid_cell_v + grid_dcontour_off,
        coords[0][0] * grid_cell_h,
        coords[0][1] * grid_cell_v);

  for (int i = 1; i < coords.length; i++) {
    line (coords[i-1][0] * grid_cell_h,
          coords[i-1][1] * grid_cell_v,
          coords[i][0] * grid_cell_h,
          coords[i][1] * grid_cell_v);
  }

  line (coords[coords.length - 1][0] * grid_cell_h + grid_dcontour_off,
        coords[coords.length - 1][1] * grid_cell_v - grid_dcontour_off,
        coords[coords.length - 1][0] * grid_cell_h,
        coords[coords.length - 1][1] * grid_cell_v);

  // labels
  pushMatrix();
  translate(coords[0][0] * grid_cell_h - 20, coords[0][1] * grid_cell_v + 25);
  rotate(-PI/4);
  text('d = ' + d, 0, 0);
  popMatrix();
}

/**
 * Draw one d-path segment.
 *
 * @param edges An array of edges consisting of coordinate pairs.
 */
void drawDpathSegment(edges) {
  if (edges.length == 0) {
    return;
  }

  for (int i = 0; i < edges.length; i++) {
    line(edges[i][0] * grid_cell_h,
         edges[i][1] * grid_cell_v,
         edges[i][2] * grid_cell_h,
         edges[i][3] * grid_cell_v);
  }

  double rot = atan2(
      edges[edges.length-1][3]-edges[edges.length-1][1],
      edges[edges.length-1][2]-edges[edges.length-1][0]
      );
  drawArrowHead(edges[edges.length-1][2] * grid_cell_h,
      edges[edges.length-1][3] * grid_cell_v, rot);
}

/**
 * Mark position of lcs member
 */
void drawLcsPosition(pos) {
  ellipseMode(CENTER);
  ellipse(pos.x * grid_cell_h, pos.y * grid_cell_v, 4, 4);
}

/**
 * Draw an arrow head at (x,y). Rotation should be given in radians.
 */
void drawArrowHead(x, y, rot) {
  pushMatrix();
  translate(x, y);
  rotate(rot);
  triangle(0, 0, -8, -2, -8, 2);
  popMatrix();
}

/**
 * Highlight the area where a recursive step is being limited to.
 */
void drawLimits(recursion) {
  int x = recursion.left[0] * grid_cell_h - 8,
      y = recursion.left[1] * grid_cell_v - 8,
      w = (recursion.right[0] - recursion.left[0]) * grid_cell_h + 16,
      h = (recursion.right[1] - recursion.left[1]) * grid_cell_v + 16;
  stroke(0, 127);
  fill(#FFFFFF, 127);
  rect(x, y, w, h);
}
