//Dota2 的世界里有两个阵营：Radiant（天辉）和 Dire（夜魇）
//Dota2 参议院由来自两派的参议员组成。现在参议院希望对一个 Dota2 游戏里的改变作出决定。他们以一个基于轮为过程的投票进行。在每一轮中，每一位参议员都可以行使两项权利中的 一 项：
//剥夺一名参议员的权利：一名参议员可以使另一名参议员在本轮及所有后续轮次中失去所有权利。
//宣布胜利：如果参议员发现有权利投票的参议员都是 同一个阵营的 ，他可以宣布胜利并决定在游戏中的有关变化。
//给你一个字符串 senate 代表每个参议员的阵营。字母 'R' 和 'D'分别代表了 Radiant（天辉）和 Dire（夜魇）。然后，如果有 n 个参议员，给定字符串的大小将是 n。以轮为基础的过程从给定顺序的第一个参议员开始到最后一个参议员结束。这一过程将持续到投票结束。所有失去权利的参议员将在过程中被跳过。
//假设每一位参议员都足够聪明，会为自己的政党做出最好的策略，你需要预测哪一方最终会宣布胜利并在 Dota2 游戏中决定改变。输出应该是 "Radiant" 或 "Dire" 。
class Solution {
public:
    string predictPartyVictory(string senate) {
        int len=senate.size();
        int r_exe=0,d_exe=0,r_num=0,d_num=0,r_enum=0,d_enum=0;
        //exe表示被操作的位置，num表示总数，enum表示被清除的数量
        for (int i=0;i<len;i++) {
            if (senate[i]=='R') r_num++;
            else d_num++;
        }
        int i=0;
        while (r_enum<r_num && d_enum<d_num) {//确保删除数小于议员数
            if (senate[i]=='R') {
                d_enum++;
                d_exe=i;//从当前开始向后寻找，可以避免一些麻烦
                while (senate[d_exe]!='D') d_exe=(d_exe+1)%senate.size();//确保永远在范围内
                senate.erase(d_exe,1);
                i++;
                if (d_exe<i) i--;//如果操作位置在前面，要记得将i--
            }
            else {
                r_enum++;
                r_exe=i;
                while (senate[r_exe]!='R') r_exe=(r_exe+1)%senate.size();
                senate.erase(r_exe,1);
                i++;
                if (r_exe<i) i--;
            }
            if (i>=senate.size()) i=0;//可能需要不止一轮操作
        }
        return senate.back()=='R'?"Radiant":"Dire";
    }
};
