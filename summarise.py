# -*- coding: utf-8 -*-
from __future__ import division
import re


class SummaryTool(object):
    def split_content_to_sentences(self, content):
        content = content.replace("\n", ". ")
        return content.split(". ")

    def split_content_to_paragraphs(self, content):
        return content.split("\n\n")

    def sentences_intersection(self, sent1, sent2):

        s1 = set(sent1.split(" "))
        s2 = set(sent2.split(" "))

        if (len(s1) + len(s2)) == 0:
            return 0

        return len(s1.intersection(s2)) / ((len(s1) + len(s2)) / 2)

    def format_sentence(self, sentence):
        sentence = re.sub(r'\W+', '', sentence)
        return sentence

    def get_senteces_ranks(self, content):

        sentences = self.split_content_to_sentences(content)

        n = len(sentences)
        values = [[0 for x in xrange(n)] for x in xrange(n)]
        for i in range(0, n):
            for j in range(0, n):
                values[i][j] = self.sentences_intersection(sentences[i], sentences[j])

        sentences_dic = {}
        for i in range(0, n):
            score = 0
            for j in range(0, n):
                if i == j:
                    continue
                score += values[i][j]
            sentences_dic[self.format_sentence(sentences[i])] = score
        return sentences_dic

    def get_best_sentence(self, paragraph, sentences_dic):

        sentences = self.split_content_to_sentences(paragraph)

        if len(sentences) < 2:
            return ""

        best_sentence = ""
        max_value = 0
        for s in sentences:
            strip_s = self.format_sentence(s)
            if strip_s:
                if sentences_dic[strip_s] > max_value:
                    max_value = sentences_dic[strip_s]
                    best_sentence = s

        return best_sentence

    def get_summary(self, title, content, sentences_dic):

        paragraphs = self.split_content_to_paragraphs(content)

        summary = []
        summary.append(title.strip())
        summary.append("")

        for p in paragraphs:
            sentence = self.get_best_sentence(p, sentences_dic).strip()
            if sentence:
                summary.append(sentence)

        return ("\n").join(summary)


def main():
    filena = open("para2.txt", 'r')
    content=filena.read()

    title = """
    """


    st = SummaryTool()

    sentences_dic = st.get_senteces_ranks(content)

    summary = st.get_summary(title, content, sentences_dic)

    print summary

    print ""
    print "Original Length %s" % (len(title) + len(content))
    print "Summary Length %s" % len(summary)


if __name__ == '__main__':
    main()
