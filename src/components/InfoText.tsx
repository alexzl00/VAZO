import { Box, Typography, List, ListItem } from "@mui/material";

export default function InfoText({ rawText }: { rawText: string }) {
  const paragraphs = rawText.split("\n").filter(p => p.trim() !== "");

  return (
    <Box sx={{ p: 1, mt: -1 }}>
      {paragraphs.map((para, index) => {
        // Check if paragraph contains bullet points
        if (para.startsWith("•")) {
          return (
            <List key={index} sx={{ pl: 2 }}>
              {para
                .split("•")
                .filter(item => item.trim() !== "")
                .map((item, i) => (
                  <ListItem
                    key={i}
                    sx={{ display: "list-item", pl: 0, paddingTop: 0, paddingBottom: 0 }}
                  >
                    <Typography variant="body1">{item.trim()}</Typography>
                  </ListItem>
                ))}
            </List>
          );
        }

        // Regular text
        return (
          <Typography
            key={index}
            variant={index === 0 ? "h6" : "body1"}
            sx={{ mb: 1 }}
          >
            {para}
          </Typography>
        );
      })}
    </Box>
  );
}

