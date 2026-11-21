import io
import qrcode
import qrcode.image.svg

class QRGeneratorService:

    @staticmethod
    def generate_qr_svg(content: str) -> str:
        """
        Generates scalable SVG string for serialized equipment QR labels.
        """
        factory = qrcode.image.svg.SvgPathImage
        img = qrcode.make(content, image_factory=factory, box_size=12)
        stream = io.BytesIO()
        img.save(stream)
        svg_str = stream.getvalue().decode('utf-8')
        return svg_str

    @staticmethod
    def generate_qr_data_url(content: str) -> str:
        """
        Generates standard QR SVG data URL for instant rendering.
        """
        svg_content = QRGeneratorService.generate_qr_svg(content)
        import base64
        b64 = base64.b64encode(svg_content.encode('utf-8')).decode('utf-8')
        return f"data:image/svg+xml;base64,{b64}"
