import io
from datetime import datetime
from typing import Dict, Any, List
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class PDFGeneratorService:

    @staticmethod
    def generate_quotation_pdf(quote_data: Dict[str, Any]) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        elements = []

        styles = getSampleStyleSheet()
        header_style = ParagraphStyle('Header', parent=styles['Heading1'], fontSize=20, textColor=colors.HexColor('#0F172A'), spaceAfter=4)
        sub_style = ParagraphStyle('Sub', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#475569'))
        table_title = ParagraphStyle('TTitle', parent=styles['Heading3'], fontSize=12, textColor=colors.HexColor('#0F172A'), spaceAfter=6)

        # Header
        elements.append(Paragraph("<b>SUNPOWER SOLUTIONS</b>", header_style))
        elements.append(Paragraph("Rooftop Solar EPC • Commercial & Residential Turnkey Solar Energy Systems", sub_style))
        elements.append(Paragraph("GSTIN: 27AABCS1234F1Z8 • contact@sunpowersolutions.com • +91 98200 12345", sub_style))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#10B981'), spaceAfter=15, spaceBefore=6))

        # Metadata block
        q_num = quote_data.get("quotation_number", "QT-2026-001")
        c_name = quote_data.get("customer_name", "Valued Customer")
        cap = quote_data.get("system_capacity_kw", 3.0)
        sys_type = quote_data.get("system_type", "ON_GRID")
        total = quote_data.get("total_amount", 185000.0)
        advance = quote_data.get("advance_required_amount", 55500.0)

        meta_data = [
            ["Quotation No:", q_num, "Customer Name:", c_name],
            ["System Type:", str(sys_type).replace("_", " "), "System Capacity:", f"{cap} kW"],
            ["Date Issued:", datetime.utcnow().strftime('%d-%b-%Y'), "Validity:", "15 Days from issue"]
        ]
        meta_table = Table(meta_data, colWidths=[110, 160, 110, 160])
        meta_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#475569')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#475569')),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
            ('FONTNAME', (3, 0), (3, -1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 15))

        # Bill of Materials items
        elements.append(Paragraph("<b>Package Hardware & Services Breakdown</b>", table_title))
        items_table_data = [["No.", "Description", "Qty", "Amount (INR)"]]
        items = quote_data.get("items", [])
        if not items:
            items_table_data.append(["1", f"{cap} kW Monocrystalline Bifacial Solar Modules & Mounting Structure", "1 Set", f"Rs. {quote_data.get('hardware_cost', 125000):,}"])
            items_table_data.append(["2", "High Efficiency Grid-Tied Inverter with Remote WiFi Monitoring", "1 No", "Included"])
            items_table_data.append(["3", "Complete DC/AC Cabling, Earthing Pit & Protection Switchgear", "1 Set", f"Rs. {quote_data.get('accessories_cost', 8000):,}"])
            items_table_data.append(["4", "Full Rooftop Installation, Testing & Commissioning Service", "Turnkey", f"Rs. {quote_data.get('installation_labour_cost', 15000):,}"])
        else:
            for idx, item in enumerate(items):
                items_table_data.append([str(idx + 1), item.get("item_name", "Component"), f"{item.get('quantity', 1)} {item.get('unit', '')}", f"Rs. {item.get('total_price', 0):,}"])

        items_table = Table(items_table_data, colWidths=[30, 310, 80, 120])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 15))

        # Total summary table
        subtotal = quote_data.get("subtotal", 165000.0)
        tax = quote_data.get("tax_amount", 19800.0)
        summary_data = [
            ["Subtotal (Excl. Tax):", f"Rs. {subtotal:,.2f}"],
            ["Goods & Services Tax (GST 12%):", f"Rs. {tax:,.2f}"],
            ["Total Payable (Turnkey):", f"Rs. {total:,.2f}"],
            ["Required Advance for Warehouse Dispatch (30%):", f"Rs. {advance:,.2f}"]
        ]
        sum_table = Table(summary_data, colWidths=[360, 180])
        sum_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 2), (-1, 2), 'Helvetica-Bold'),
            ('TEXTCOLOR', (0, 2), (-1, 2), colors.HexColor('#059669')),
            ('FONTSIZE', (0, 2), (-1, 2), 10),
            ('FONTNAME', (0, 3), (-1, 3), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#FEF3C7')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(sum_table)
        elements.append(Spacer(1, 20))

        # Terms
        elements.append(Paragraph("<b>Standard Terms & Warranty Conditions:</b>", table_title))
        terms_text = (
            "1. 25-Year Performance Warranty on Solar PV Modules.<br/>"
            "2. 5-Year Comprehensive Warranty on Inverter and System Workmanship.<br/>"
            "3. Dispatch of materials from warehouse is released upon receipt of mandatory 30% advance payment.<br/>"
            "4. Net metering approval and subsidy facilitation under PM Surya Ghar are handled by our dedicated liaison team."
        )
        elements.append(Paragraph(terms_text, sub_style))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def generate_warranty_certificate_pdf(warranty_data: Dict[str, Any]) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        elements = []

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('WTitle', parent=styles['Heading1'], fontSize=22, alignment=1, textColor=colors.HexColor('#0F172A'), spaceAfter=6)
        sub_style = ParagraphStyle('WSub', parent=styles['Normal'], fontSize=11, alignment=1, textColor=colors.HexColor('#059669'), spaceAfter=20)
        body_style = ParagraphStyle('WBody', parent=styles['Normal'], fontSize=9.5, textColor=colors.HexColor('#334155'), spaceAfter=10)

        elements.append(Paragraph("<b>SUNPOWER SOLUTIONS</b>", title_style))
        elements.append(Paragraph("<b>OFFICIAL WARRANTY & PERFORMANCE CERTIFICATE</b>", sub_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#F59E0B'), spaceAfter=20))

        w_code = warranty_data.get("warranty_code", "WAR-2026-001")
        serial = warranty_data.get("serial_number", "INV-2026-4401")
        product = warranty_data.get("product_name", "Solar PV Inverter")
        c_name = warranty_data.get("customer_name", "Customer")
        s_date = warranty_data.get("start_date", datetime.utcnow()).strftime('%d-%b-%Y')
        e_date = warranty_data.get("end_date", datetime.utcnow()).strftime('%d-%b-%Y')
        years = warranty_data.get("duration_years", 5)

        table_data = [
            ["Warranty Certificate Ref:", w_code],
            ["Customer Name:", c_name],
            ["Equipment Description:", product],
            ["Equipment Serial Number:", serial],
            ["Warranty Duration:", f"{years} Full Calendar Years"],
            ["Commencement Date (Delivery/Commissioning):", s_date],
            ["Expiration Date:", e_date],
            ["Warranty Status:", "ACTIVE & REGISTERED"]
        ]
        t = Table(table_data, colWidths=[240, 300])
        t.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#ECFDF5')),
            ('TEXTCOLOR', (1, -1), (1, -1), colors.HexColor('#059669')),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 25))

        elements.append(Paragraph(
            "This document certifies that the serialized hardware specified above is covered against manufacturing defects, "
            "premature component failure, and workmanship faults under SunPower Solutions' manufacturer warranty agreement. "
            "Warranty claims can be submitted via the SunPower Customer Portal or hotline with the Serial Number above.",
            body_style
        ))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()
