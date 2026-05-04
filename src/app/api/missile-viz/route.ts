import { NextResponse } from 'next/server';

export async function GET() {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>North Korea Missile Test Visualization</title>
      <meta name="viewport" content="user-scalable=no, minimum-scale=1.0, maximum-scale=1.0, initial-scale=1">
      <link rel="stylesheet" type="text/css" href="/missile-viz/css/OverlayScrollbars.min.css">
      <link rel="stylesheet" type="text/css" href="/missile-viz/css/style.css">
      <style>
        html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
      </style>
    </head>
    <body>
      <div id="wrapper">
        <div id="loading">
          <h2>Loading North Korea Missile Test Data from 1984 to 2026. Please wait...</h2>
        </div>
        <div>
          <table id="marker_template" class="marker" style="left:'0px';top:'0px'">
            <tr><td><span id="testText" class="test"></span><div class="close"></div></td></tr>
            <tr><td><span id="detailText" class="detail"></span></td></tr>
            <tr><td><span id="descriptionText" class="description"></span></td></tr>
          </table>
        </div>
        <div id="visualization">
          <div id="glContainer"></div>
        </div>
      </div>

      <script src="/missile-viz/js/Detector.js"><\/script>
      <script src="/missile-viz/js/three-r87.min.js"><\/script>
      <script src="/missile-viz/js/THREEx.KeyboardState.js"><\/script>
      <script src="/missile-viz/js/THREEx.WindowResize.js"><\/script>
      <script src="/missile-viz/js/jquery-3.4.1.min.js"><\/script>
      <script src="/missile-viz/js/jquery-ui-1.12.1.custom.min.js"><\/script>
      <script src="/missile-viz/js/jquery.ui.touch-punch.min.js"><\/script>
      <script src="/missile-viz/js/RequestAnimationFrame.js"><\/script>
      <script src="/missile-viz/js/ShaderExtras.js"><\/script>
      <script src="/missile-viz/js/util.js"><\/script>
      <script src="/missile-viz/js/mousekeyboard.js"><\/script>
      <script src="/missile-viz/js/dataloading.js"><\/script>
      <script src="/missile-viz/js/geopins.js"><\/script>
      <script src="/missile-viz/js/visualize.js"><\/script>
      <script src="/missile-viz/js/visualize_lines.js"><\/script>
      <script src="/missile-viz/js/markers.js"><\/script>
      <script src="/missile-viz/js/orb-satellite.v2.js"><\/script>
      <script src="/missile-viz/js/satellites.js"><\/script>
      <script src="/missile-viz/js/d3-5.12.0.min.js"><\/script>
      <script src="/missile-viz/js/ui.controls.js"><\/script>
      <script src="/missile-viz/js/hammer-2.0.8.min.js"><\/script>
      <script src="/missile-viz/js/jquery.overlayScrollbars.min.js"><\/script>
      <script>
        // Initialize and start the visualization
        window.addEventListener('load', () => {
          if (typeof start === 'function') {
            start();
          }
        });
      <\/script>
      <script src="/missile-viz/js/main.js"><\/script>
    </body>
    </html>
  `;

  return new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
