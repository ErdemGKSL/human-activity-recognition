import {
  BulletList,
  Callout,
  Document,
  KeyValue,
  Paragraph,
  Section,
  SubSection,
  Table,
  TitlePage,
  Todo,
  docTheme as t,
} from "@har/report/pdf";
import type { Deck } from "@pptx/core";
import type { CSSProperties } from "react";
import { slideTitle } from "./slide-title";
import type { DeckDirections, SlideDirection } from "./types";

/** `<img src>` key for slide `index` (0-based); matched by the `images` passed to renderPdf. */
export const thumbnailSrc = (index: number) => `slide-${index + 1}.png`;

const THUMB = { width: 300, height: 169 };

interface Props {
  deck: Deck;
  directions: DeckDirections;
  /** Render slide thumbnails (their bytes must be passed as `images`). */
  thumbnails: boolean;
}

/** The presenter guide for one deck: overview, running order, then one page per slide. */
export function DirectionsDocument({ deck, directions, thumbnails }: Props) {
  const total = deck.slides.length;
  return (
    <Document>
      <TitlePage
        eyebrow="Anlatıcı Rehberi"
        title={deck.title}
        subtitle="Slaytlarda az metin, burada tüm hikâye: ne anlatılacak, sayılar ne anlama geliyor, nasıl sunulacak."
        meta={[
          ["Tarih", directions.date],
          ["Süre", directions.duration],
          ["Slayt sayısı", String(total)],
        ]}
      />
      <Section title="Proje Özeti">
        {directions.summary ? (
          <Paragraph>{directions.summary}</Paragraph>
        ) : (
          <Todo>Projenin tek paragraflık özeti.</Todo>
        )}
      </Section>
      {directions.opening ? (
        <Section title={`Açılış Konuşması (${directions.opening.duration})`}>
          <Callout tone="tip" title="İlk slayt açıkken, dinleyiciye dönerek">
            <Paragraph>“{directions.opening.text}”</Paragraph>
          </Callout>
        </Section>
      ) : null}
      <Section title="Genel Yönlendirmeler">
        {directions.overview?.length ? (
          <BulletList items={directions.overview} />
        ) : (
          <Todo>Dinleyici kitlesi, sunumun ana hikâyesi, kim hangi bölümü anlatacak.</Todo>
        )}
      </Section>
      <Section title="Sunum Akışı">
        <Table
          columns={["#", "Slayt", "Süre", "Konuşmacı"]}
          widths={[0.4, 4, 1, 2]}
          rows={deck.slides.map((slide, i) => [
            String(i + 1),
            slideTitle(slide),
            directions.slides[slide.id]?.time ?? "—",
            directions.speakers?.[slide.id] ?? "—",
          ])}
        />
      </Section>
      {deck.slides.map((slide, i) => (
        <SlidePage
          key={slide.id}
          index={i}
          total={total}
          title={slideTitle(slide)}
          speaker={directions.speakers?.[slide.id]}
          direction={directions.slides[slide.id] ?? {}}
          thumbnail={thumbnails}
        />
      ))}
      {directions.questions?.length ? (
        <Section title="Hocanın Sorabileceği Sorular" newPage>
          {directions.questions.map(({ question, answer }, i) => (
            <Callout key={question} title={`${i + 1}. ${question}`}>
              <Paragraph>{answer}</Paragraph>
            </Callout>
          ))}
        </Section>
      ) : null}
      {directions.glossary?.length ? (
        <Section title="Ek: Terimler Sözlüğü" newPage>
          <Paragraph muted>
            Slaytlarda ve bu rehberde İngilizce bırakılan terimler, alfabetik sırayla.
          </Paragraph>
          <Table
            columns={["Terim", "Anlamı"]}
            widths={[1, 3.2]}
            rows={[...directions.glossary]
              .sort((a, b) => a.term.localeCompare(b.term, deck.lang))
              .map((g) => [g.term, g.meaning])}
          />
        </Section>
      ) : null}
    </Document>
  );
}

const row: CSSProperties = { display: "flex", gap: 16, alignItems: "flex-start" };

function SlidePage({
  index,
  total,
  title,
  speaker,
  direction: d,
  thumbnail,
}: {
  index: number;
  total: number;
  title: string;
  speaker: string | undefined;
  direction: SlideDirection;
  thumbnail: boolean;
}) {
  return (
    <Section title={`Slayt ${index + 1}/${total} — ${title}`} newPage>
      <div style={row}>
        {thumbnail && (
          <img
            src={thumbnailSrc(index)}
            alt={title}
            style={{
              ...THUMB,
              border: `1px solid ${t.colors.border}`,
              borderRadius: t.radius,
            }}
          />
        )}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 8 }}>
          <KeyValue
            rows={[
              ["Süre", d.time ?? "TODO"],
              ["Konuşmacı", speaker ?? "—"],
            ]}
          />
          <Callout title="Bu slaytın amacı">
            <Paragraph>{d.goal ?? "TODO: Dinleyici bu slayttan tek cümleyle ne almalı?"}</Paragraph>
          </Callout>
        </div>
      </div>

      <SubSection title="Anlatıcı Metni">
        {d.script?.length ? d.script.map((p) => <Paragraph key={p}>{p}</Paragraph>) : <Todo />}
      </SubSection>

      {d.data?.length ? (
        <SubSection title="Slayttaki Veriler Ne Anlama Geliyor?">
          <Table
            columns={["Slayttaki öğe", "Anlamı / nasıl anlatılır"]}
            widths={[1, 2.5]}
            rows={d.data.map((n) => [n.label, n.meaning])}
          />
        </SubSection>
      ) : null}

      {d.funFacts?.map((fact) => (
        <Callout key={fact} tone="tip" title="Fun fact">
          <Paragraph>{fact}</Paragraph>
        </Callout>
      ))}

      {d.tips?.length ? (
        <SubSection title="Sunum İpuçları">
          <BulletList items={d.tips} />
        </SubSection>
      ) : null}

      {d.visuals?.length ? (
        <SubSection title="Görsel Önerileri">
          <BulletList items={d.visuals} />
        </SubSection>
      ) : null}

      {d.questions?.length ? (
        <SubSection title="Olası Sorular">
          {d.questions.map(({ question, answer }) => (
            <Callout key={question} title={`S: ${question}`}>
              <Paragraph>C: {answer}</Paragraph>
            </Callout>
          ))}
        </SubSection>
      ) : null}

      {d.transition && (
        <Callout title="Sonraki slayta geçiş">
          <Paragraph>“{d.transition}”</Paragraph>
        </Callout>
      )}
    </Section>
  );
}
