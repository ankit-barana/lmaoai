import React from "react";
import FontUbuntuBold from "../assets/fonts/Ubuntu-Bold.ttf";

import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  body: {
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
  },
  text: {
    margin: 12,
    fontSize: 14,
    textAlign: "justify",
    fontFamily: "Ubuntu",
  },
  header: {
    fontSize: 14,
    marginBottom: 4,
    color: "black",
    fontFamily: "UbuntuBold",
    fontWeight: "bold",
  },
});

Font.register({
  family: "Ubuntu",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/questrial/v13/QdVUSTchPBm7nuUeVf7EuStkm20oJA.ttf",
    },
  ],
});

Font.register({
  family: "UbuntuBold",
  fonts: [
    {
      // src: "https://fonts.gstatic.com/s/questrial/v13/QdVUSTchPBm7nuUeVf7EuStkm20oJA.ttf",
      src: FontUbuntuBold,
      fontWeight: "bold",
    },
  ],
});

function PDFDocument({ data }) {
  return (
    <Document>
      <Page size="A4" style={styles.body}>
        {data &&
          data.map((qa_pair, index) => {
            return (
              <>
                <Text style={styles.header}>{qa_pair.question}</Text>
                <Text style={styles.text}>{qa_pair.answer}</Text>
              </>
            );
          })}
      </Page>
    </Document>
  );
}

export default PDFDocument;
